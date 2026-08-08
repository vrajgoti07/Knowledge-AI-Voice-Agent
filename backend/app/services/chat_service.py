import time
import logging
import concurrent.futures
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from app.core.config import settings
from app.services.retrieval_service import search_relevant_chunks
from app.services.llm_provider import generate_answer

logger = logging.getLogger(__name__)

RAG_TOTAL_TIMEOUT_SECONDS = 90  # Max time for the entire RAG pipeline


def generate_rag_response(
    db: Session,
    user_id: str,
    conversation_id: str,
    user_query: str,
    context_document_ids: List[str] = None
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
    """
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                _generate_rag_response_core,
                db, user_id, conversation_id, user_query, context_document_ids
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
    context_document_ids: List[str] = None
) -> Tuple[str, List[Dict[str, any]], Dict[str, any]]:
    t0 = time.time()

    # ── STAGE 1: VECTOR RETRIEVAL ──────────────────────────────────
    try:
        retrieved_chunks = search_relevant_chunks(
            db, user_id=user_id, query=user_query, top_k=8, context_document_ids=context_document_ids
        )
    except Exception as ret_err:
        logger.error(f"[RAG Timing] Retrieval Exception: {ret_err}", exc_info=True)
        retrieved_chunks = []

    t1 = time.time()
    logger.info(f"[RAG Timing] Stage 1 (Vector Retrieval) took {t1 - t0:.2f}s — returned {len(retrieved_chunks)} chunks")

    # ── STAGE 2: LLM GENERATION (via multi-provider fallback) ─────
    zero_chunk_mode = len(retrieved_chunks) == 0

    # Build citations from retrieved chunks (independent of LLM provider)
    citations_data = []
    for idx, item in enumerate(retrieved_chunks, start=1):
        citations_data.append({
            "document_id": item["document_id"],
            "document_title": item["document_title"],
            "excerpt": item["content"][:200] + "..." if len(item["content"]) > 200 else item["content"],
            "page": item["page"],
            "chunk": item["chunk_index"],
            "score": item["score"]
        })

    t2 = time.time()
    logger.info(f"[RAG Timing] Stage 2 (Citation Assembly) took {t2 - t1:.2f}s")

    # ── STAGE 3: MULTI-PROVIDER LLM CALL ──────────────────────────
    llm_result = generate_answer(
        query=user_query,
        retrieved_chunks=retrieved_chunks,
        zero_chunk_mode=zero_chunk_mode,
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
    }

    return llm_result["answer"], citations_data, metadata
