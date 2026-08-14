"""
retrieval_service.py — Vector search + cross-encoder re-ranking + parent expansion
===================================================================================
Pipeline:
  1. Generate query embedding with all-MiniLM-L6-v2 (bi-encoder, fast)
  2. Retrieve top-20 candidates from Qdrant by cosine similarity
  3. Log all top-10 raw scores BEFORE re-ranking (debug)
  4. Re-rank candidates with cross-encoder/ms-marco-MiniLM-L-6-v2 (precise)
  5. Apply HARD minimum relevance threshold — return [] instead of weak results
  6. WORKFLOW / PROCESS INTENT DETECTOR & PARENT-SECTION EXPANSION:
     If query asks for workflow/process/steps/stages, expand top chunk's parent section
     to retrieve ALL child sub-chunks (7.1 through 7.12) in natural section order.
"""
import re
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import generate_embeddings, EMBEDDING_MODEL_NAME
from app.core.qdrant_client import search_qdrant_chunks, fetch_parent_section_chunks_qdrant

logger = logging.getLogger("knowledge_ai.retrieval")

# ── Tunable thresholds ────────────────────────────────────────────────────────
RERANK_MIN_SCORE: float = 0.35
QDRANT_CANDIDATE_K: int = 20
FINAL_TOP_K: int = 8
MAX_CHUNKS_PER_DOC: int = 3
DEBUG_LOG_TOP_N: int = 10


# ── Workflow/Process Intent Detection Patterns ───────────────────────────────
_WORKFLOW_INTENT_PATTERNS = [
    re.compile(r'\b(?:workflow|process|steps|stages|pipeline|lifecycle|life cycle)\b', re.IGNORECASE),
    re.compile(r'how\s+(?:does|to)\s+.*\s+(?:work|build|run|execute)', re.IGNORECASE),
    re.compile(r'step\s*by\s*step', re.IGNORECASE),
    re.compile(r'end\s*to\s*end', re.IGNORECASE),
    re.compile(r'\b(?:overview|list|summary|breakdown)\s+of\b', re.IGNORECASE),
    re.compile(r'\b(?:full|complete|all|entire|detailed)\s+(?:detail|details|info|information|workflow|process|steps|stages)\b', re.IGNORECASE),
]

_STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "of", "in",
    "on", "at", "to", "for", "and", "or", "but", "be", "been",
    "has", "have", "had", "do", "does", "did", "with", "from",
    "by", "about", "as", "it", "its", "this", "that", "these",
    "those", "my", "your", "we", "they", "he", "she", "not",
    "what", "which", "who", "how", "when", "where", "can", "will",
    "would", "should", "could", "if", "then", "than", "tell", "me"
}

_ACRONYM_MAP: Dict[str, str] = {
    "ml":  "machine learning",
    "ai":  "artificial intelligence",
    "nlp": "natural language processing",
    "dl":  "deep learning",
    "nn":  "neural network",
    "cv":  "computer vision",
    "db":  "database",
    "sql": "structured query language",
    "api": "application programming interface",
    "ui":  "user interface",
    "ux":  "user experience",
    "os":  "operating system",
    "rl":  "reinforcement learning",
    "llm": "large language model",
    "rag": "retrieval augmented generation",
}

_cross_encoder = None
_CROSS_ENCODER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"


def get_cross_encoder():
    global _cross_encoder
    if _cross_encoder is None:
        try:
            from sentence_transformers import CrossEncoder
            logger.info(f"[Rerank] Loading cross-encoder '{_CROSS_ENCODER_MODEL}' ...")
            _cross_encoder = CrossEncoder(_CROSS_ENCODER_MODEL, max_length=512)
            logger.info(f"[Rerank] Cross-encoder '{_CROSS_ENCODER_MODEL}' loaded successfully.")
        except Exception as e:
            logger.error(f"[Rerank] Failed to load cross-encoder: {e}. Re-ranking disabled.")
            _cross_encoder = False
    return _cross_encoder if _cross_encoder is not False else None


def warm_cross_encoder():
    try:
        model = get_cross_encoder()
        if model:
            model.predict([("warmup query", "warmup document text")])
            logger.info(f"[Rerank] Cross-encoder '{_CROSS_ENCODER_MODEL}' pre-warmed.")
    except Exception as e:
        logger.warning(f"[Rerank] Pre-warm failed (non-fatal): {e}")


def is_workflow_query(query: str) -> bool:
    """Returns True if the query asks for a multi-step process, workflow, or list."""
    if not query:
        return False
    return any(pat.search(query) for pat in _WORKFLOW_INTENT_PATTERNS)


def expand_parent_section_chunks(
    db: Session,
    chunks: List[Dict[str, Any]],
    query: str
) -> List[Dict[str, Any]]:
    """
    Parent-Section Expansion:
    When a query asks for a workflow/process/steps, and the top candidate chunk
    has a parent_section or section_number (e.g. Chapter 7, or 7.1), expand retrieval
    to fetch ALL child sub-chunks under that parent section in section order.
    """
    if not chunks or not is_workflow_query(query):
        return chunks

    top_chunk = chunks[0]
    parent_sec = top_chunk.get("parent_section")
    sec_num = top_chunk.get("section_number")
    doc_id = top_chunk.get("document_id")

    if not doc_id:
        return chunks

    # Determine section prefix (e.g. "7." if section_number is "7.1")
    section_prefix = None
    if sec_num and "." in str(sec_num):
        section_prefix = str(sec_num).split(".")[0] + "."
    elif sec_num and str(sec_num).startswith("Chapter "):
        section_prefix = str(sec_num).replace("Chapter ", "").strip() + "."

    logger.info(
        f"[ParentExpansion] Workflow query detected ('{query[:60]}'). "
        f"Top match: doc_id={doc_id}, parent_sec='{parent_sec}', sec_num='{sec_num}', prefix='{section_prefix}'"
    )

    # 1. Try Qdrant scroll for parent section chunks
    expanded_qdrant = fetch_parent_section_chunks_qdrant(
        doc_id=doc_id,
        parent_section=parent_sec,
        section_prefix=section_prefix,
        limit=50
    )

    if expanded_qdrant and len(expanded_qdrant) >= 3:
        logger.info(f"[ParentExpansion] Successfully expanded {len(expanded_qdrant)} child chunks from Qdrant.")
        for item in expanded_qdrant:
            item["is_workflow_expanded"] = True
        return expanded_qdrant

    # 2. Try SQL DB fallback for parent section chunks
    try:
        from sqlalchemy import or_
        from app.services.llm_provider import _parse_section_sort_key

        chap_num = section_prefix.rstrip('.') if section_prefix else None
        if not chap_num and parent_sec and "Chapter" in parent_sec:
            chap_match = re.search(r'Chapter\s+(\d+)', parent_sec)
            if chap_match:
                chap_num = chap_match.group(1)

        filter_conds = []
        if chap_num:
            filter_conds.append(DocumentChunk.section_number.like(f"{chap_num}.%"))
            filter_conds.append(DocumentChunk.section_number == f"Chapter {chap_num}")
            filter_conds.append(DocumentChunk.parent_section.like(f"%Chapter {chap_num}%"))
        elif parent_sec:
            filter_conds.append(DocumentChunk.parent_section == parent_sec)

        if filter_conds:
            db_chunks = db.query(DocumentChunk).filter(
                DocumentChunk.document_id == doc_id,
                or_(*filter_conds)
            ).order_by(DocumentChunk.chunk_index.asc()).all()
        else:
            db_chunks = []

        if db_chunks and len(db_chunks) >= 3:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            doc_title = doc.title if doc else top_chunk.get("document_title", "")
            raw_expanded = []
            for c in db_chunks:
                raw_expanded.append({
                    "document_id": doc_id,
                    "document_title": doc_title,
                    "content": c.content,
                    "page": c.page_number or 1,
                    "chunk_index": c.chunk_index,
                    "section_number": c.section_number,
                    "section_title": c.section_title,
                    "parent_section": c.parent_section,
                    "score": 0.85,
                    "is_workflow_expanded": True
                })

            # Deduplicate by section_number, preferring body chunks with longer content over TOC entries
            seen_sections: Dict[str, Dict[str, Any]] = {}
            for item in raw_expanded:
                sec_num = item.get("section_number")
                if not sec_num:
                    continue
                if sec_num not in seen_sections or len(item.get("content", "")) > len(seen_sections[sec_num].get("content", "")):
                    seen_sections[sec_num] = item

            deduped_expanded = sorted(seen_sections.values(), key=_parse_section_sort_key)
            logger.info(f"[ParentExpansion] Successfully expanded {len(deduped_expanded)} unique section chunks from SQL DB.")
            return deduped_expanded
    except Exception as err:
        logger.warning(f"[ParentExpansion] SQL DB expansion warning: {err}")

    return chunks


def apply_diversity_cap(
    chunks: List[Dict[str, Any]],
    max_per_doc: int = MAX_CHUNKS_PER_DOC,
    top_k: int = FINAL_TOP_K,
) -> List[Dict[str, Any]]:
    """
    Applies per-document diversity cap: selects top candidate chunks such that
    no single document contributes more than `max_per_doc` chunks (default 3) to top_k (default 8).
    """
    if not chunks:
        return []

    doc_counts: Dict[str, int] = {}
    selected: List[Dict[str, Any]] = []

    for chunk in chunks:
        doc_id = chunk.get("document_id") or "unknown"
        current_count = doc_counts.get(doc_id, 0)
        if current_count < max_per_doc:
            selected.append(chunk)
            doc_counts[doc_id] = current_count + 1
            if len(selected) >= top_k:
                break

    logger.info(
        f"[DiversityCap] Selected {len(selected)} chunks across {len(doc_counts)} documents "
        f"(max {max_per_doc} per doc, target top_k={top_k})"
    )
    return selected


def rerank_chunks(
    query: str,
    candidates: List[Dict[str, Any]],
    top_k: int = FINAL_TOP_K,
    min_score: float = RERANK_MIN_SCORE,
    max_per_doc: int = MAX_CHUNKS_PER_DOC,
) -> List[Dict[str, Any]]:
    if not candidates:
        return []

    cross_enc = get_cross_encoder()
    if cross_enc is None:
        filtered = [c for c in candidates if c.get("score", 0) >= min_score]
        return apply_diversity_cap(filtered, max_per_doc=max_per_doc, top_k=top_k)

    try:
        import math
        def sigmoid(x: float) -> float:
            x = max(-500.0, min(500.0, float(x)))
            return 1.0 / (1.0 + math.exp(-x))

        pairs = [(query, c.get("content", "")) for c in candidates]
        raw_scores = cross_enc.predict(pairs)

        scored = []
        for c, raw in zip(candidates, raw_scores):
            raw_f = float(raw)
            norm_score = sigmoid(raw_f)
            scored.append({
                **c,
                "rerank_score": round(norm_score, 4),
                "_raw_rerank_score": round(raw_f, 4),
            })

        scored.sort(key=lambda x: x["rerank_score"], reverse=True)

        logger.info(
            f"[Rerank] Cross-encoder scores for query='{query[:60]}' "
            f"(min_score={min_score}):"
        )
        for i, s in enumerate(scored[:DEBUG_LOG_TOP_N], 1):
            logger.info(
                f"  [{i:02d}] rerank_norm={s['rerank_score']:.4f} | "
                f"sec='{s.get('section_number', 'N/A')}' | "
                f"cosine={s.get('score', 0):.4f} | "
                f"page={s.get('page', '?'):>4} | "
                f"doc='{s.get('document_title', 'Unknown')[:45]}'"
            )

        filtered = [s for s in scored if s["rerank_score"] >= min_score]
        if not filtered:
            best = scored[0] if scored else {}
            logger.warning(
                f"[Rerank] HARD THRESHOLD ENFORCED: All {len(scored)} candidates scored below {min_score}. "
                f"Best: rerank_norm={best.get('rerank_score', 0):.4f}. Returning []."
            )
            return []

        return apply_diversity_cap(filtered, max_per_doc=max_per_doc, top_k=top_k)

    except Exception as e:
        logger.error(f"[Rerank] Prediction failed: {e}. Falling back to cosine.")
        filtered = [c for c in candidates if c.get("score", 0) >= min_score]
        return apply_diversity_cap(filtered, max_per_doc=max_per_doc, top_k=top_k)



def is_boilerplate_text(content: str, page_number: int) -> bool:
    if not content:
        return False
    t_lower = content.lower()
    legal_terms = [
        "isbn", "copyright", "all rights reserved", "printed in",
        "publisher", "proofreader", "editor:", "cataloging-in-publication",
        "trademarks", "library of congress", "sans serif", "typeset", "published by"
    ]
    matches = sum(1 for kw in legal_terms if kw in t_lower)
    if (page_number or 1) <= 2 and matches >= 1:
        return True
    if matches >= 2:
        return True
    return False


def search_relevant_chunks(
    db: Session,
    user_id: str,
    query: str,
    top_k: int = FINAL_TOP_K,
    context_document_ids: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Full retrieval pipeline:
      1. Bi-encoder vector search (Qdrant, top-20 candidates)
      2. Debug log: top-10 raw candidates with scores BEFORE re-ranking
      3. Cross-encoder re-ranking
      4. HARD score threshold
      5. PARENT-SECTION EXPANSION for workflow/process queries
    """
    if not query.strip():
        return []

    try:
        logger.info(
            f"[Retrieval] Query: '{query[:80]}' | "
            f"bi-encoder='{EMBEDDING_MODEL_NAME}' | candidates_k={QDRANT_CANDIDATE_K}"
        )
        query_embeddings = generate_embeddings([query])
        if query_embeddings:
            query_vector = query_embeddings[0]
            vector_results = search_qdrant_chunks(
                query_vector=query_vector,
                user_id=user_id,
                top_k=QDRANT_CANDIDATE_K,
                context_document_ids=context_document_ids
            )

            if vector_results:
                non_fm = [
                    r for r in vector_results
                    if not r.get("is_frontmatter")
                    and not is_boilerplate_text(r.get("content", ""), r.get("page", 1))
                ]
                candidates = non_fm if non_fm else vector_results

                logger.info(f"[Retrieval] RAW Qdrant results BEFORE re-ranking for query='{query[:60]}':")
                for i, r in enumerate(candidates[:DEBUG_LOG_TOP_N], 1):
                    logger.info(
                        f"  RAW[{i:02d}] cosine={r.get('score', 0):.4f} | "
                        f"sec='{r.get('section_number', 'N/A')}' | "
                        f"page={r.get('page', '?'):>4} | "
                        f"doc='{r.get('document_title', 'Unknown')[:45]}'"
                    )

                reranked = rerank_chunks(
                    query=query,
                    candidates=candidates,
                    top_k=top_k,
                    min_score=RERANK_MIN_SCORE,
                )

                if reranked:
                    logger.info(f"[Retrieval] FINAL results after re-ranking ({len(reranked)} chunks):")
                    for i, r in enumerate(reranked, 1):
                        logger.info(
                            f"  FINAL[{i}] rerank={r.get('rerank_score', 'N/A'):.4f} | "
                            f"sec='{r.get('section_number', 'N/A')}' | "
                            f"page={r.get('page', '?')} | "
                            f"doc='{r.get('document_title', 'Unknown')[:50]}'"
                        )
                    # Expand parent section if this is a process/workflow query
                    expanded = expand_parent_section_chunks(db, reranked, query)
                    return expanded
                else:
                    logger.warning(
                        f"[Retrieval] Qdrant search 0 chunks passed threshold {RERANK_MIN_SCORE}. Trying SQL fallback..."
                    )
                    return _sql_keyword_search(db, user_id, query, top_k, context_document_ids)

    except Exception as ve:
        logger.warning(f"[Retrieval] Qdrant search error, falling back to SQL: {ve}")

    return _sql_keyword_search(db, user_id, query, top_k, context_document_ids)


def _sql_keyword_search(
    db: Session,
    user_id: str,
    query: str,
    top_k: int,
    context_document_ids: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """SQL keyword search with section metadata and parent expansion."""
    logger.info(f"[Retrieval] SQL keyword fallback for query='{query[:60]}'")

    query_builder = db.query(Document).filter(
        (Document.uploaded_by == user_id) | (Document.is_knowledge_base == True)
    )
    if context_document_ids:
        query_builder = query_builder.filter(Document.id.in_(context_document_ids))

    user_docs = query_builder.all()
    if not user_docs:
        return []

    doc_ids = [d.id for d in user_docs]
    doc_map = {d.id: d for d in user_docs}

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id.in_(doc_ids)).all()
    if not chunks:
        return []

    raw_tokens = [t.lower() for t in query.split()]
    keywords: set = set()
    for token in raw_tokens:
        if token in _STOPWORDS:
            continue
        keywords.add(token)
        if token in _ACRONYM_MAP:
            for exp_word in _ACRONYM_MAP[token].split():
                if exp_word not in _STOPWORDS:
                    keywords.add(exp_word)

    if not keywords:
        keywords = {t for t in raw_tokens if t not in _STOPWORDS}
    if not keywords:
        keywords = set(raw_tokens)

    scored_chunks = []
    for c in chunks:
        score = 0.0
        content_lower = c.content.lower()
        for kw in keywords:
            if kw in content_lower:
                score += 1.5 + content_lower.count(kw) * 0.5
        if is_boilerplate_text(c.content, c.page_number or 1):
            score *= 0.05

        doc = doc_map.get(c.document_id)
        if score > 0.5:
            scored_chunks.append({"chunk": c, "document": doc, "score": score})

    if not scored_chunks:
        return []

    non_bp = [sc for sc in scored_chunks
              if not is_boilerplate_text(sc["chunk"].content, sc["chunk"].page_number or 1)]
    if non_bp:
        scored_chunks = non_bp

    scored_chunks.sort(key=lambda x: x["score"], reverse=True)

    sql_raw = []
    for item in scored_chunks[:QDRANT_CANDIDATE_K]:
        c = item["chunk"]
        d = item["document"]
        sql_raw.append({
            "document_id": d.id,
            "document_title": d.title,
            "content": c.content,
            "page": c.page_number or 1,
            "chunk_index": c.chunk_index,
            "section_number": c.section_number,
            "section_title": c.section_title,
            "parent_section": c.parent_section,
            "score": round(float(item["score"]), 4),
        })

    SQL_RERANK_THRESHOLD = 0.35
    reranked_sql = rerank_chunks(
        query=query,
        candidates=sql_raw,
        top_k=top_k,
        min_score=SQL_RERANK_THRESHOLD,
    )

    if reranked_sql:
        expanded_sql = expand_parent_section_chunks(db, reranked_sql, query)
        return expanded_sql

    return []
