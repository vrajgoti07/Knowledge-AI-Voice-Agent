import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import generate_embeddings
from app.core.qdrant_client import search_qdrant_chunks

logger = logging.getLogger("knowledge_ai.retrieval")

# Common stopwords for fallback keyword search
_STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "of", "in",
    "on", "at", "to", "for", "and", "or", "but", "be", "been",
    "has", "have", "had", "do", "does", "did", "with", "from",
    "by", "about", "as", "it", "its", "this", "that", "these",
    "those", "my", "your", "we", "they", "he", "she", "not",
    "what", "which", "who", "how", "when", "where", "can", "will",
    "would", "should", "could", "if", "then", "than"
}

_ACRONYM_MAP: Dict[str, str] = {
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "nlp": "natural language processing",
    "dl": "deep learning",
    "nn": "neural network",
    "cv": "computer vision",
    "db": "database",
    "sql": "structured query language",
    "api": "application programming interface",
    "ui": "user interface",
    "ux": "user experience",
    "os": "operating system",
    "rl": "reinforcement learning",
    "llm": "large language model",
    "rag": "retrieval augmented generation",
}


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
    top_k: int = 8,
    context_document_ids: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Primary: Performs 384-dimensional Qdrant vector similarity search using Cosine distance.
    Fallback: Performs SQL keyword/acronym matching if Qdrant is empty or offline.
    """
    if not query.strip():
        return []

    # ── 1. REAL QDRANT VECTOR SEMANTIC SEARCH ─────────────────────
    try:
        query_embeddings = generate_embeddings([query])
        if query_embeddings:
            query_vector = query_embeddings[0]
            vector_results = search_qdrant_chunks(
                query_vector=query_vector,
                user_id=user_id,
                top_k=top_k,
                context_document_ids=context_document_ids
            )
            if vector_results:
                non_fm = [
                    r for r in vector_results
                    if not r.get("is_frontmatter") and not is_boilerplate_text(r.get("content", ""), r.get("page", 1))
                ]
                final_results = non_fm if non_fm else vector_results
                # Filter out chunks with very low similarity score (cutoff threshold 0.30 for Cosine)
                filtered_vector = [r for r in final_results if r.get("score", 0) >= 0.30]
                if not filtered_vector and final_results:
                    # Keep at least the top match if all are below 0.30 but above 0.20
                    filtered_vector = [r for r in final_results if r.get("score", 0) >= 0.20][:1]
                logger.info(f"Qdrant vector search returned {len(filtered_vector)} semantic matches (filtered frontmatter & low score).")
                return filtered_vector[:top_k]
    except Exception as ve:
        logger.warning(f"Qdrant vector search error, falling back to SQL search: {ve}")

    # ── 2. FALLBACK SQL KEYWORD & ACRONYM SEARCH ────────────────────
    logger.info("Performing fallback SQL keyword retrieval.")
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
    keywords = set()
    for token in raw_tokens:
        if token in _STOPWORDS:
            continue
        keywords.add(token)
        if token in _ACRONYM_MAP:
            expansion = _ACRONYM_MAP[token]
            for exp_word in expansion.split():
                if exp_word not in _STOPWORDS:
                    keywords.add(exp_word)

    if not keywords:
        keywords = set(raw_tokens)

    scored_chunks = []
    for c in chunks:
        score = 0.0
        content_lower = c.content.lower()
        for kw in keywords:
            if kw in content_lower:
                score += 1.5 + content_lower.count(kw) * 0.5

        # Penalize frontmatter/legal boilerplate text so copyright pages don't rank top
        if is_boilerplate_text(c.content, c.page_number or 1):
            score *= 0.05

        doc = doc_map.get(c.document_id)
        if score > 0.5:  # Require meaningful keyword match (score > 0.5)
            scored_chunks.append({
                "chunk": c,
                "document": doc,
                "score": score
            })

    # Deprioritize frontmatter chunks if non-boilerplate matching chunks exist
    non_bp = [sc for sc in scored_chunks if not is_boilerplate_text(sc["chunk"].content, sc["chunk"].page_number or 1)]
    if non_bp:
        scored_chunks = non_bp

    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
    top_results = scored_chunks[:top_k]

    results = []
    for item in top_results:
        c = item["chunk"]
        d = item["document"]
        results.append({
            "document_id": d.id,
            "document_title": d.title,
            "content": c.content,
            "page": c.page_number or 1,
            "chunk_index": c.chunk_index,
            "score": round(float(item["score"]), 4)
        })

    return results

