"""
debug.py — Admin-only debug retrieval endpoint
================================================
GET /api/v1/debug/retrieval?query=<query>&limit=20

Returns:
  - raw_results: top Qdrant cosine-similarity results BEFORE re-ranking
  - reranked_results: top results AFTER cross-encoder re-ranking
  - metadata: model names, candidate count, threshold used

This endpoint is invaluable for diagnosing ranking quality without guessing.
"""
import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.db.session import get_db
from app.models.user import User
from app.core.deps import require_admin
from app.services.embedding_service import generate_embeddings, EMBEDDING_MODEL_NAME
from app.core.qdrant_client import search_qdrant_chunks
from app.services.retrieval_service import (
    rerank_chunks,
    is_boilerplate_text,
    QDRANT_CANDIDATE_K,
    RERANK_MIN_SCORE,
    FINAL_TOP_K,
    _CROSS_ENCODER_MODEL,
)

logger = logging.getLogger("knowledge_ai.debug")

router = APIRouter(prefix="/debug", tags=["Debug (Admin)"], dependencies=[Depends(require_admin)])


@router.get("/retrieval")
def debug_retrieval(
    query: str = Query(..., description="The search query to test"),
    limit: int = Query(20, ge=1, le=50, description="Max raw candidates to return"),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Debug endpoint: shows raw Qdrant cosine results + cross-encoder re-ranked results
    for a given query. Use this to inspect ranking quality and diagnose issues.

    Returns:
      - raw_results: top-N chunks BEFORE re-ranking (cosine score, source, page)
      - reranked_results: top-K chunks AFTER re-ranking (rerank score, cosine, source, page)
      - metadata: model info, thresholds
    """
    logger.info(f"[Debug] Retrieval debug requested by admin='{admin_user.id}' for query='{query[:80]}'")

    # ── 1. Generate query embedding ──────────────────────────────────────────
    try:
        query_embeddings = generate_embeddings([query])
        if not query_embeddings:
            return {"error": "Failed to generate query embedding.", "query": query}
        query_vector = query_embeddings[0]
    except Exception as e:
        return {"error": f"Embedding error: {str(e)}", "query": query}

    # ── 2. Raw Qdrant search (wider net for full picture) ────────────────────
    try:
        raw_results = search_qdrant_chunks(
            query_vector=query_vector,
            user_id=admin_user.id,
            top_k=limit,
            context_document_ids=None,  # Search ALL documents for admin debug
        )
    except Exception as e:
        return {"error": f"Qdrant search error: {str(e)}", "query": query}

    # Filter boilerplate for cleaner debug view
    non_fm = [
        r for r in raw_results
        if not r.get("is_frontmatter")
        and not is_boilerplate_text(r.get("content", ""), r.get("page", 1))
    ]
    candidates = non_fm if non_fm else raw_results

    raw_formatted = [
        {
            "rank": i + 1,
            "cosine_score": r.get("score", 0),
            "document_title": r.get("document_title", "Unknown"),
            "page": r.get("page", "?"),
            "chunk_index": r.get("chunk_index", 0),
            "content_preview": r.get("content", "")[:300] + ("..." if len(r.get("content", "")) > 300 else ""),
            "is_frontmatter": r.get("is_frontmatter", False),
        }
        for i, r in enumerate(candidates[:limit])
    ]

    # ── 3. Cross-encoder re-ranking ──────────────────────────────────────────
    try:
        reranked = rerank_chunks(
            query=query,
            candidates=candidates,
            top_k=FINAL_TOP_K,
            min_score=RERANK_MIN_SCORE,
        )
        reranked_formatted = [
            {
                "rank": i + 1,
                "rerank_score": r.get("rerank_score", None),
                "cosine_score": r.get("score", 0),
                "document_title": r.get("document_title", "Unknown"),
                "page": r.get("page", "?"),
                "chunk_index": r.get("chunk_index", 0),
                "content_preview": r.get("content", "")[:400] + ("..." if len(r.get("content", "")) > 400 else ""),
            }
            for i, r in enumerate(reranked)
        ]
        rerank_error = None
    except Exception as e:
        reranked_formatted = []
        rerank_error = str(e)
        logger.error(f"[Debug] Re-ranking error: {e}")

    return {
        "query": query,
        "metadata": {
            "bi_encoder_model": EMBEDDING_MODEL_NAME,
            "cross_encoder_model": _CROSS_ENCODER_MODEL,
            "qdrant_candidate_k": QDRANT_CANDIDATE_K,
            "rerank_min_score": RERANK_MIN_SCORE,
            "final_top_k": FINAL_TOP_K,
            "total_raw_candidates": len(candidates),
            "total_after_rerank": len(reranked_formatted),
        },
        "raw_results_before_reranking": raw_formatted,
        "reranked_results": reranked_formatted,
        "rerank_error": rerank_error,
    }


@router.get("/chunk-counts")
def debug_chunk_counts(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Shows chunk counts per document vs page counts.
    Useful to verify that large PDFs aren't silently producing fewer chunks per page than small PDFs.
    A healthy ratio is roughly 1–4 chunks per page.
    """
    from app.models.document import Document
    from app.models.document_chunk import DocumentChunk
    from sqlalchemy import func

    docs = db.query(Document).filter(Document.status == "ready").all()
    results = []
    for doc in docs:
        chunk_count = db.query(func.count(DocumentChunk.id))\
            .filter(DocumentChunk.document_id == doc.id).scalar()
        pages = doc.chunks  # doc.chunks stores the total chunk count set at indexing
        # Try to estimate page count from stored page info
        max_page = db.query(func.max(DocumentChunk.page_number))\
            .filter(DocumentChunk.document_id == doc.id).scalar() or 1

        chunks_per_page = round(chunk_count / max(max_page, 1), 2)
        results.append({
            "document_id": doc.id,
            "title": doc.title,
            "status": doc.status,
            "file_type": doc.file_type,
            "chunk_count_in_db": chunk_count,
            "max_page_number": max_page,
            "chunks_per_page": chunks_per_page,
            "flag": "⚠ LOW" if chunks_per_page < 0.5 else ("✅ OK" if chunks_per_page <= 6 else "⚠ HIGH"),
        })

    results.sort(key=lambda x: x["chunks_per_page"])
    return {
        "total_documents": len(results),
        "note": "Healthy ratio is ~1-4 chunks per page. Flag ⚠ LOW may indicate silent indexing failures on that document.",
        "documents": results,
    }
