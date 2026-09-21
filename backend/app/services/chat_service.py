import re
import time
import logging
import concurrent.futures
from typing import List, Dict, Tuple, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.document import Document
from app.services.retrieval_service import search_relevant_chunks
from app.services.llm_provider import (
    generate_answer,
    generate_comparison_answer,
    classify_question_llm,
    rewrite_query_with_context,
)

logger = logging.getLogger(__name__)

RAG_TOTAL_TIMEOUT_SECONDS = 90  # Max time for the entire RAG pipeline


_DEF_PATTERNS = [
    re.compile(r'^\s*(?:what\s+is|what\s+are|define|what\s+does\s+.*\s+mean)\b', re.IGNORECASE),
    re.compile(r'\bmeaning\s+of\b', re.IGNORECASE),
    re.compile(r'^\s*definition\s+of\b', re.IGNORECASE),
]
_EXP_PATTERNS = [
    re.compile(r'^\s*(?:explain|how\s+does|why\s+does|how\s+do|why\s+is|why\s+are|how\s+can|how\s+works)\b', re.IGNORECASE),
    re.compile(r'\bhow\s+it\s+works\b', re.IGNORECASE),
]
_LIST_PATTERNS = [
    re.compile(r'^\s*(?:list|steps\s+to|what\s+are\s+the\s+(?:types|steps|methods|ways|kinds|categories|approaches)|how\s+to)\b', re.IGNORECASE),
    re.compile(r'\b(?:types|steps|methods|categories|advantages|disadvantages)\s+of\b', re.IGNORECASE),
]
_COMP_PATTERNS = [
    re.compile(r'^\s*(?:difference\s+between|compare|vs\.?|versus|comparison|how\s+does\s+.*\s+differ)\b', re.IGNORECASE),
    re.compile(r'\b(?:difference|comparison|versus|\bvs\b)\b', re.IGNORECASE),
]
_FORMULA_PATTERNS = [
    re.compile(r'^\s*(?:formula|equation|how\s+(?:do\s+you|to)\s+calculate|calculate|how\s+is\s+.*\s+calculated|math\s+for)\b', re.IGNORECASE),
    re.compile(r'\b(?:formula|equation|calculation|math\s+formula|derivation)\b', re.IGNORECASE),
]
_SUMMARY_PATTERNS = [
    re.compile(r'^\s*(?:summarize|summary\s+of|give\s+a\s+summary|overview\s+of)\b', re.IGNORECASE),
    re.compile(r'\b(?:summary|overview|key\s+takeaways)\b', re.IGNORECASE),
]


_DETAIL_INTENT_PATTERNS = [
    re.compile(r'\b(?:in details?|in-depth|more details?|give (?:me )?(?:more|details?|in details?)|explain in detail|elaborate|expand|comprehensive)\b', re.IGNORECASE),
    re.compile(r'\b(?:tell me more|expand on|deep dive|further details?)\b', re.IGNORECASE),
]


def classify_question_type(query: str) -> str:
    """
    Classifies the user's question into one of six categories:
    - DEFINITION ("what is X", "define X")
    - EXPLANATION ("explain X", "how does X work", "why does X happen")
    - LIST ("list the types of X", "steps to do X")
    - COMPARISON ("difference between X and Y", "compare X and Y")
    - FORMULA ("formula for X", "how do you calculate X")
    - SUMMARY ("summarize this document/chapter")
    """
    q = (query or "").strip().lower()
    if not q:
        return "EXPLANATION"

    # Detail expansion intent always maps to EXPLANATION
    if any(p.search(q) for p in _DETAIL_INTENT_PATTERNS):
        return "EXPLANATION"

    # Fast heuristic check in priority order
    if any(p.search(q) for p in _FORMULA_PATTERNS):
        return "FORMULA"
    if any(p.search(q) for p in _COMP_PATTERNS):
        return "COMPARISON"
    if any(p.search(q) for p in _SUMMARY_PATTERNS):
        return "SUMMARY"
    if any(p.search(q) for p in _LIST_PATTERNS):
        return "LIST"
    if any(p.search(q) for p in _DEF_PATTERNS):
        if "formula" in q or "calculate" in q or "equation" in q:
            return "FORMULA"
        if "difference" in q or "compare" in q:
            return "COMPARISON"
        if "steps" in q or "types" in q or "methods" in q:
            return "LIST"
        return "DEFINITION"
    if any(p.search(q) for p in _EXP_PATTERNS):
        return "EXPLANATION"

    # Quick LLM fallback if regex heuristic is ambiguous
    try:
        llm_type = classify_question_llm(query)
        if llm_type in {"DEFINITION", "EXPLANATION", "LIST", "COMPARISON", "FORMULA", "SUMMARY"}:
            logger.info(f"[QuestionClassifier] LLM classified '{query[:50]}' as {llm_type}")
            return llm_type
    except Exception as e:
        logger.warning(f"[QuestionClassifier] LLM fallback classification warning: {e}")

    return "EXPLANATION"


def generate_rag_response(
    db: Session,
    user_id: str,
    conversation_id: str,
    user_query: str,
    context_document_ids: List[str] = None,
    conversation_history: List[any] = None,
    running_summary: str = None,
) -> Tuple[str, List[Dict[str, any]], Dict[str, any]]:
    """
    Generates a RAG response with a total pipeline timeout.
    Wraps the core logic in a thread to prevent indefinite hangs.

    Returns
    -------
    (answer_text, citations_list, metadata_dict)
        metadata_dict contains:
            provider : str  — "gemini" | "groq" | "ollama" | "fallback"
            degraded : bool — True if all LLMs failed and raw chunks were returned
            rewritten_query : str — query used for retrieval after context resolution
    """
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                _generate_rag_response_core,
                db, user_id, conversation_id, user_query, context_document_ids,
                conversation_history, running_summary
            )
            return future.result(timeout=RAG_TOTAL_TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        logger.error(f"[RAG] Total pipeline timeout ({RAG_TOTAL_TIMEOUT_SECONDS}s) exceeded for query: {user_query[:50]}")
        return (
            "The response took too long to generate. This can happen on the first query while models are loading. "
            "Please try again — subsequent queries will be much faster.",
            [],
            {"provider": "timeout", "degraded": True}
        )
    except Exception as e:
        logger.error(f"[RAG] Unexpected error in pipeline wrapper: {e}", exc_info=True)
        return (
            f"An unexpected error occurred: {str(e)[:200]}. Please try again.",
            [],
            {"provider": "error", "degraded": True}
        )


def _generate_rag_response_core(
    db: Session,
    user_id: str,
    conversation_id: str,
    user_query: str,
    context_document_ids: List[str] = None,
    conversation_history: List[any] = None,
    running_summary: str = None,
) -> Tuple[str, List[Dict[str, any]], Dict[str, any]]:
    t0 = time.time()

    # ── STAGE 0A: CONTEXT-AWARE QUERY REWRITING ────────────────────
    retrieval_query = rewrite_query_with_context(
        user_query=user_query,
        conversation_history=conversation_history,
        running_summary=running_summary,
    )
    if retrieval_query != user_query:
        logger.info(f"[RAG] Query rewritten for retrieval: '{user_query}' -> '{retrieval_query}'")
    else:
        logger.info(f"[RAG] Using standalone query: '{user_query}'")

    # ── STAGE 0B: QUESTION TYPE CLASSIFICATION ─────────────────────
    # Check detail-intent override from either user query or rewritten query
    if any(p.search(user_query) for p in _DETAIL_INTENT_PATTERNS) or any(p.search(retrieval_query) for p in _DETAIL_INTENT_PATTERNS):
        question_type = "EXPLANATION"
    else:
        question_type = classify_question_type(retrieval_query)
    logger.info(f"[RAG Timing] Question Type for query '{retrieval_query[:50]}': {question_type}")

    # ── STAGE 1: VECTOR RETRIEVAL ──────────────────────────────────
    try:
        retrieved_chunks = search_relevant_chunks(
            db, user_id=user_id, query=retrieval_query, top_k=8, context_document_ids=context_document_ids
        )
    except Exception as ret_err:
        logger.error(f"[RAG Timing] Retrieval Exception: {ret_err}", exc_info=True)
        retrieved_chunks = []

    t1 = time.time()
    logger.info(f"[RAG Timing] Stage 1 (Vector Retrieval) took {t1 - t0:.2f}s — returned {len(retrieved_chunks)} chunks")

    # ── STAGE 2: LLM GENERATION (via multi-provider fallback) ─────
    zero_chunk_mode = len(retrieved_chunks) == 0

    # Build citations from retrieved chunks (independent of LLM provider)
    # Build citations from retrieved chunks
    citations_data = []
    if retrieved_chunks:
        is_multi_doc = bool(context_document_ids and len(context_document_ids) > 1)
        top_chunk = retrieved_chunks[0]
        top_doc_id = top_chunk.get("document_id")
        max_score = max((item.get("score") or 0) for item in retrieved_chunks)

        for idx, item in enumerate(retrieved_chunks, start=1):
            item_score = item.get("score") or 0
            item_doc_id = item.get("document_id")

            if is_multi_doc:
                # In multi-document chat, include relevant evidence from all selected documents
                if item_score >= max(0.20, max_score * 0.40):
                    citations_data.append({
                        "document_id": item["document_id"],
                        "document_title": item["document_title"],
                        "excerpt": item["content"][:200] + "..." if len(item["content"]) > 200 else item["content"],
                        "page": item["page"],
                        "chunk": item["chunk_index"],
                        "score": item_score
                    })
            else:
                # In single-document/open KB mode, include pages from the primary document answering user query
                if item_doc_id == top_doc_id:
                    if item_score >= max_score * 0.50:
                        citations_data.append({
                            "document_id": item["document_id"],
                            "document_title": item["document_title"],
                            "excerpt": item["content"][:200] + "..." if len(item["content"]) > 200 else item["content"],
                            "page": item["page"],
                            "chunk": item["chunk_index"],
                            "score": item_score
                        })
                else:
                    # Only permit a secondary document if its relevance is exceptionally high (>= 90% of top and >= 0.50)
                    if max_score >= 0.50 and item_score >= max_score * 0.90:
                        citations_data.append({
                            "document_id": item["document_id"],
                            "document_title": item["document_title"],
                            "excerpt": item["content"][:200] + "..." if len(item["content"]) > 200 else item["content"],
                            "page": item["page"],
                            "chunk": item["chunk_index"],
                            "score": item_score
                        })

    t2 = time.time()
    logger.info(f"[RAG Timing] Stage 2 (Citation Assembly) took {t2 - t1:.2f}s")

    # ── STAGE 3: MULTI-PROVIDER LLM CALL ──────────────────────────
    llm_result = generate_answer(
        query=user_query,
        retrieved_chunks=retrieved_chunks,
        zero_chunk_mode=zero_chunk_mode,
        question_type=question_type,
        conversation_history=conversation_history,
        running_summary=running_summary,
    )

    t3 = time.time()
    logger.info(
        f"[RAG Timing] Stage 3 (LLM via {llm_result['provider']}) took {t3 - t2:.2f}s "
        f"(Total: {t3 - t0:.2f}s) | degraded={llm_result['degraded']}"
    )

    metadata = {
        "provider": llm_result["provider"],
        "degraded": llm_result["degraded"],
        "speech_text": llm_result.get("speech_text", llm_result["answer"]),
        "question_type": question_type,
        "rewritten_query": retrieval_query,
    }

    return llm_result["answer"], citations_data, metadata


def handle_comparison_query(
    db: Session,
    user_id: str,
    conversation_id: str,
    user_query: str,
    document_ids: List[str],
    conversation_history: List[Any] = None,
    running_summary: str = None,
) -> Tuple[str, List[Dict[str, Any]], Dict[str, Any]]:
    """
    Executes a structured multi-document comparison query with timeout protection:
    Runs retrieval separately per document to prevent cross-document starvation,
    partitions evidence, and synthesizes similarities and differences.
    """
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                _handle_comparison_query_core,
                db, user_id, conversation_id, user_query, document_ids,
                conversation_history, running_summary
            )
            return future.result(timeout=RAG_TOTAL_TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        logger.error(f"[Comparison] Total pipeline timeout ({RAG_TOTAL_TIMEOUT_SECONDS}s) exceeded for comparison query")
        return (
            "The comparison analysis took too long to generate. Please try again with fewer documents or a more specific question.",
            [],
            {"provider": "timeout", "degraded": True, "is_comparison": True}
        )
    except Exception as e:
        logger.error(f"[Comparison] Unexpected error in pipeline: {e}", exc_info=True)
        return (
            f"An unexpected error occurred during comparison: {str(e)[:200]}. Please try again.",
            [],
            {"provider": "error", "degraded": True, "is_comparison": True}
        )


def _handle_comparison_query_core(
    db: Session,
    user_id: str,
    conversation_id: str,
    user_query: str,
    document_ids: List[str],
    conversation_history: List[Any] = None,
    running_summary: str = None,
) -> Tuple[str, List[Dict[str, Any]], Dict[str, Any]]:
    t0 = time.time()
    if not document_ids or len(document_ids) < 2:
        raise ValueError("Comparison mode requires at least 2 document IDs.")

    # 1. Fetch document titles
    docs = db.query(Document).filter(Document.id.in_(document_ids)).all()
    doc_title_map = {d.id: d.title for d in docs}

    # 2. Retrieve top chunks SEPARATELY per document
    per_doc_chunks: Dict[str, Dict[str, Any]] = {}
    citations_data: List[Dict[str, Any]] = []

    chunks_per_doc = 4
    for doc_id in document_ids:
        title = doc_title_map.get(doc_id, f"Document {doc_id[:8]}")
        try:
            chunks = search_relevant_chunks(
                db=db,
                user_id=user_id,
                query=user_query,
                top_k=chunks_per_doc,
                context_document_ids=[doc_id],
            )
        except Exception as e:
            logger.warning(f"[Comparison] Retrieval failed for doc {doc_id}: {e}")
            chunks = []

        per_doc_chunks[doc_id] = {
            "title": title,
            "chunks": chunks,
        }

        # Build citations tagged clearly to each source document
        for c in chunks:
            score = c.get("score") or c.get("rerank_score") or 0.5
            if score >= 0.15:
                citations_data.append({
                    "document_id": c["document_id"],
                    "document_title": c.get("document_title") or title,
                    "excerpt": c["content"][:200] + "..." if len(c["content"]) > 200 else c["content"],
                    "page": c.get("page", 1),
                    "chunk": c.get("chunk_index", 0),
                    "score": round(float(score), 4),
                })

    t1 = time.time()
    logger.info(f"[Comparison Timing] Retrieval took {t1 - t0:.2f}s across {len(document_ids)} documents")

    # 3. Call generate_comparison_answer
    llm_result = generate_comparison_answer(
        query=user_query,
        per_doc_chunks=per_doc_chunks,
        conversation_history=conversation_history,
        running_summary=running_summary,
    )

    t2 = time.time()
    logger.info(f"[Comparison Timing] LLM answer generation took {t2 - t1:.2f}s (Total: {t2 - t0:.2f}s)")

    metadata = {
        "provider": llm_result["provider"],
        "degraded": llm_result["degraded"],
        "speech_text": llm_result.get("speech_text", llm_result["answer"]),
        "question_type": "COMPARISON",
        "is_comparison": True,
        "document_ids": document_ids,
    }

    return llm_result["answer"], citations_data, metadata


