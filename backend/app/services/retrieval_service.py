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
from app.services.embedding_service import generate_embeddings, EMBEDDING_MODEL_NAME, is_low_information_chunk
from app.core.qdrant_client import search_qdrant_chunks, fetch_parent_section_chunks_qdrant

logger = logging.getLogger("knowledge_ai.retrieval")

# ── Tunable thresholds ────────────────────────────────────────────────────────
RERANK_MIN_SCORE: float = 0.20
RERANK_MIN_SCORE_BM25_ONLY: float = 0.15  # Lower threshold when Qdrant is offline
QDRANT_CANDIDATE_K: int = 30  # Increased from 20 for better cross-PDF coverage
FINAL_TOP_K: int = 8
MAX_CHUNKS_PER_DOC: int = 3
MIN_DOCS_IN_RESULT: int = 2  # Try to include at least 2 different PDFs
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
    "svm": "support vector machine",
    "knn": "k nearest neighbors",
    "pca": "principal component analysis",
    "eda": "exploratory data analysis",
    "cnn": "convolutional neural network",
    "rnn": "recurrent neural network",
    "gd":  "gradient descent",
    "sgd": "stochastic gradient descent",
    "mse": "mean squared error",
    "mae": "mean absolute error",
    "lr":  "logistic regression",
    "dt":  "decision tree",
    "rf":  "random forest",
}

# ── Semantic Concept Synonyms ────────────────────────────────────────────────
# Maps common query terms to related concepts found in ML textbooks.
# This helps BM25 find chunks when the user uses different terminology.
_CONCEPT_SYNONYMS: Dict[str, List[str]] = {
    "overfitting":       ["overfit", "memorizing", "variance", "regularization", "generalization"],
    "underfitting":      ["underfit", "bias", "high bias", "poor fit"],
    "regularization":    ["l1", "l2", "lasso", "ridge", "penalty", "overfitting"],
    "supervised":        ["classification", "regression", "labeled", "labels", "training data"],
    "unsupervised":      ["clustering", "dimensionality reduction", "unlabeled"],
    "classification":    ["classifier", "classify", "class label", "categorical", "supervised"],
    "regression":        ["predict", "continuous", "linear regression", "supervised"],
    "clustering":        ["cluster", "k-means", "hierarchical", "unsupervised", "grouping"],
    "preprocessing":     ["data cleaning", "normalization", "standardization", "missing values", "feature scaling"],
    "feature":           ["attribute", "variable", "column", "predictor", "input"],
    "training":          ["train", "fit", "learning", "model training"],
    "testing":           ["test", "evaluation", "validation", "test set"],
    "accuracy":          ["precision", "recall", "f1", "performance", "metrics"],
    "gradient descent":  ["optimization", "learning rate", "convergence", "gradient"],
    "decision tree":     ["tree", "splitting", "entropy", "gini", "information gain"],
    "neural network":    ["neuron", "layer", "activation", "backpropagation", "deep learning"],
    "cross validation":  ["k-fold", "validation", "holdout", "train test split"],
    "bias":              ["underfitting", "systematic error"],
    "variance":          ["overfitting", "model complexity"],
    "ensemble":          ["bagging", "boosting", "random forest", "voting", "stacking"],
    "naive bayes":       ["bayes theorem", "probability", "conditional", "prior"],
    "svm":               ["support vector", "hyperplane", "kernel", "margin"],
    "knn":               ["nearest neighbor", "distance", "euclidean", "similarity"],
    "linear regression": ["least squares", "slope", "intercept", "ordinary least squares"],
    "logistic regression":["sigmoid", "binary classification", "log odds", "probability"],
    "normalization":     ["min-max", "scaling", "feature scaling", "standardization"],
    "standardization":   ["z-score", "mean", "standard deviation", "normalization"],
    "missing values":    ["imputation", "null", "nan", "missing data", "preprocessing"],
    "outlier":           ["anomaly", "outliers", "detection", "iqr", "z-score"],
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
    min_docs: int = MIN_DOCS_IN_RESULT,
) -> List[Dict[str, Any]]:
    """
    Applies per-document diversity cap: selects top candidate chunks such that
    no single document contributes more than `max_per_doc` chunks (default 3) to top_k (default 8).
    Also ensures we pull from at least `min_docs` different PDFs when available.
    """
    if not chunks:
        return []

    # Count unique documents available
    available_doc_ids = set(c.get("document_id") or "unknown" for c in chunks)
    num_available_docs = len(available_doc_ids)

    # If we have enough docs, adaptively lower max_per_doc to ensure diversity
    effective_max = max_per_doc
    if num_available_docs >= min_docs and top_k >= min_docs * 2:
        # e.g., if 4 PDFs available and top_k=8, allow at most 3 per doc
        effective_max = min(max_per_doc, max(2, top_k // min(num_available_docs, 4)))

    doc_counts: Dict[str, int] = {}
    selected: List[Dict[str, Any]] = []

    # First pass: pick top chunks respecting per-doc cap
    for chunk in chunks:
        doc_id = chunk.get("document_id") or "unknown"
        current_count = doc_counts.get(doc_id, 0)
        if current_count < effective_max:
            selected.append(chunk)
            doc_counts[doc_id] = current_count + 1
            if len(selected) >= top_k:
                break

    # Second pass: if we only got chunks from 1 doc but more docs are available,
    # force-include top chunk from other docs for cross-PDF coverage
    if len(doc_counts) < min(min_docs, num_available_docs) and len(selected) < top_k:
        included_docs = set(doc_counts.keys())
        for chunk in chunks:
            doc_id = chunk.get("document_id") or "unknown"
            if doc_id not in included_docs:
                selected.append(chunk)
                doc_counts[doc_id] = 1
                included_docs.add(doc_id)
                if len(selected) >= top_k or len(included_docs) >= min_docs:
                    break

    logger.info(
        f"[DiversityCap] Selected {len(selected)} chunks across {len(doc_counts)} documents "
        f"(max {effective_max} per doc, target top_k={top_k}, available_docs={num_available_docs})"
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

    # 1. Filter out low-information meta/TOC candidates before reranking
    valid_candidates = [
        c for c in candidates
        if not is_low_information_chunk(c.get("content", ""), c.get("page", 1))
    ]
    if not valid_candidates:
        valid_candidates = candidates  # Fallback to candidates if all were filtered

    cross_enc = get_cross_encoder()
    if cross_enc is None:
        filtered = [c for c in valid_candidates if c.get("score", 0) >= min_score]
        return apply_diversity_cap(filtered, max_per_doc=max_per_doc, top_k=top_k)

    try:
        import math
        def sigmoid(x: float) -> float:
            x = max(-500.0, min(500.0, float(x)))
            return 1.0 / (1.0 + math.exp(-x))

        q_lower = query.lower()
        q_words = re.findall(r'\b[a-zA-Z0-9_\-\.]+\b', q_lower)
        expansions = []
        for w in q_words:
            if w in _ACRONYM_MAP:
                expansions.append(_ACRONYM_MAP[w])
        expanded_query = f"{query} {' '.join(expansions)}".strip() if expansions else query

        pairs = []
        for c in valid_candidates:
            doc_t = c.get("document_title") or ""
            sec_t = c.get("section_title") or ""
            sec_n = c.get("section_number") or ""
            hdr = f"[{doc_t} — {sec_n} {sec_t}]\n" if (sec_t or doc_t) else ""
            pairs.append((expanded_query, f"{hdr}{c.get('content', '')}"))

        raw_scores = cross_enc.predict(pairs)

        scored = []
        for c, raw in zip(valid_candidates, raw_scores):
            raw_f = float(raw)
            norm_score = sigmoid(raw_f)

            # Substance-aware scoring:
            # Rich, complete paragraphs (60-350 words) receive a boost.
            # Short fragments (<35 words) receive a penalty to avoid ranking above real definitions.
            content = c.get("content", "")
            words_count = len(content.split())
            substance_multiplier = 1.0
            if words_count >= 60:
                substance_multiplier = 1.06  # 6% boost for complete, rich paragraphs
            elif words_count < 35:
                substance_multiplier = 0.82  # 18% penalty for fragmentary snippets

            final_score = round(min(1.0, norm_score * substance_multiplier), 4)

            scored.append({
                **c,
                "rerank_score": final_score,
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
                f"words={len(s.get('content', '').split()):>3} | "
                f"sec='{s.get('section_number', 'N/A')}' | "
                f"cosine={s.get('score', 0):.4f} | "
                f"page={s.get('page', '?'):>4} | "
                f"doc='{s.get('document_title', 'Unknown')[:45]}'"
            )

        filtered = [s for s in scored if s["rerank_score"] >= min_score]
        if not filtered:
            # SOFT FALLBACK: return top 3 by score instead of [] so the
            # LLM / fallback formatter can still produce a useful answer.
            soft_top = scored[:3] if scored else []
            best = scored[0] if scored else {}
            logger.warning(
                f"[Rerank] SOFT FALLBACK: All {len(scored)} candidates scored below {min_score}. "
                f"Best: rerank_norm={best.get('rerank_score', 0):.4f}. Returning top {len(soft_top)} for LLM/fallback."
            )
            return apply_diversity_cap(soft_top, max_per_doc=max_per_doc, top_k=top_k)

        return apply_diversity_cap(filtered, max_per_doc=max_per_doc, top_k=top_k)

    except Exception as e:
        logger.error(f"[Rerank] Prediction failed: {e}. Falling back to cosine.")
        filtered = [c for c in valid_candidates if c.get("score", 0) >= min_score]
        return apply_diversity_cap(filtered, max_per_doc=max_per_doc, top_k=top_k)


def is_boilerplate_text(content: str, page_number: int) -> bool:
    if not content:
        return False
    if is_low_information_chunk(content, page_number):
        return True
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


def _expand_query_with_synonyms(query: str) -> str:
    """
    Expands a query with semantically related terms from _CONCEPT_SYNONYMS.
    e.g. 'explain overfitting' → 'explain overfitting overfit memorizing variance regularization generalization'
    """
    q_lower = query.lower()
    q_words = set(re.findall(r'\b[a-zA-Z_]+\b', q_lower))
    expansions = []

    for concept, synonyms in _CONCEPT_SYNONYMS.items():
        concept_words = set(concept.split())
        # Check if concept appears as substring or as individual words
        if concept in q_lower or concept_words.intersection(q_words):
            for syn in synonyms:
                if syn not in q_lower:
                    expansions.append(syn)

    if expansions:
        # Limit to top 8 expansion terms to avoid query dilution
        expansion_str = " ".join(expansions[:8])
        logger.info(f"[BM25] Synonym expansion: '{query[:50]}' + [{expansion_str[:80]}]")
        return f"{query} {expansion_str}"
    return query


def _bm25_search(
    db: Session,
    user_id: str,
    query: str,
    top_k: int = QDRANT_CANDIDATE_K,
    context_document_ids: List[str] = None
) -> List[Dict[str, Any]]:
    """
    In-memory BM25 keyword search across all user document chunks.
    Builds an in-memory index from chunks in SQLite for the user's ready documents.
    Includes synonym expansion for better recall when Qdrant is offline.
    """
    try:
        from rank_bm25 import BM25Okapi
        q_user = db.query(Document).filter(
            (Document.uploaded_by == user_id) | (Document.is_knowledge_base == True),
            Document.status == "ready"
        )
        if context_document_ids:
            q_user = q_user.filter(Document.id.in_(context_document_ids))
        user_docs = q_user.all()

        if not user_docs:
            return []

        doc_ids = [d.id for d in user_docs]
        doc_map = {d.id: d for d in user_docs}

        chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id.in_(doc_ids)).all()
        if not chunks:
            return []

        def tokenize(text: str) -> List[str]:
            words = re.findall(r'\b[a-zA-Z0-9_\-\.]+\b', text.lower())
            tokens = []
            for w in words:
                if w in _STOPWORDS:
                    continue
                tokens.append(w)
                if w in _ACRONYM_MAP:
                    tokens.extend(_ACRONYM_MAP[w].split())
            return tokens

        tokenized_corpus = []
        for c in chunks:
            d = doc_map.get(c.document_id)
            doc_t = d.title if d else ""
            sec_t = c.section_title or ""
            sec_n = c.section_number or ""
            full_searchable = f"{doc_t} {sec_n} {sec_t} {c.content}"
            tokenized_corpus.append(tokenize(full_searchable))

        # Expand query with semantic synonyms for better recall
        expanded_query = _expand_query_with_synonyms(query)

        tokenized_query = tokenize(expanded_query)
        if not tokenized_query:
            tokenized_query = [w.lower() for w in query.split()]

        # For definition queries, ensure definition terms help elevate definition chunks
        if re.search(r'\b(?:what\s+is|what\s+are|define|definition|meaning)\b', query.lower()):
            tokenized_query.extend(["definition", "defined", "meaning"])

        bm25 = BM25Okapi(tokenized_corpus)
        scores = bm25.get_scores(tokenized_query)

        scored_candidates = []
        for idx, score in enumerate(scores):
            if score > 0.05:
                c = chunks[idx]
                d = doc_map.get(c.document_id)
                if not d:
                    continue
                if is_boilerplate_text(c.content, c.page_number or 1):
                    continue
                scored_candidates.append({
                    "document_id": d.id,
                    "document_title": d.title,
                    "content": c.content,
                    "page": c.page_number or 1,
                    "page_start": getattr(c, "page_start", c.page_number or 1),
                    "page_end": getattr(c, "page_end", c.page_number or 1),
                    "chunk_index": c.chunk_index,
                    "section_number": c.section_number,
                    "section_title": c.section_title,
                    "parent_section": c.parent_section,
                    "parent_id": getattr(c, "parent_id", None),
                    "parent_content": getattr(c, "parent_content", None),
                    "bm25_score": round(float(score), 4),
                    "score": round(float(score), 4)
                })

        scored_candidates.sort(key=lambda x: x["bm25_score"], reverse=True)

        # Log cross-document coverage
        doc_coverage = set(c["document_id"] for c in scored_candidates[:top_k])
        logger.info(
            f"[BM25] Found {len(scored_candidates)} candidates across {len(doc_coverage)} documents "
            f"(returning top {top_k})"
        )

        return scored_candidates[:top_k]
    except Exception as bm_err:
        logger.warning(f"[BM25] Keyword search warning: {bm_err}")
        return []


def reciprocal_rank_fusion(
    dense_results: List[Dict[str, Any]],
    bm25_results: List[Dict[str, Any]],
    k: int = 60,
    top_k: int = 20
) -> List[Dict[str, Any]]:
    """
    Combines dense vector search results and BM25 keyword search results
    using Reciprocal Rank Fusion (RRF):
    RRF_score(d) = 1/(k + rank_dense(d)) + 1/(k + rank_bm25(d))
    """
    scores: Dict[str, float] = {}
    items: Dict[str, Dict[str, Any]] = {}

    for rank, item in enumerate(dense_results, 1):
        key = f"{item.get('document_id')}_{item.get('chunk_index')}"
        items[key] = item
        scores[key] = scores.get(key, 0.0) + 1.0 / (k + rank)

    for rank, item in enumerate(bm25_results, 1):
        key = f"{item.get('document_id')}_{item.get('chunk_index')}"
        if key not in items:
            items[key] = item
        scores[key] = scores.get(key, 0.0) + 1.0 / (k + rank)

    fused = []
    for key, rrf_score in scores.items():
        chunk_data = dict(items[key])
        chunk_data["rrf_score"] = round(rrf_score, 6)
        fused.append(chunk_data)

    fused.sort(key=lambda x: x["rrf_score"], reverse=True)
    return fused[:top_k]


def apply_parent_context_expansion(
    chunks: List[Dict[str, Any]],
    max_context_chars: int = 16000  # ~4000 tokens safe budget
) -> List[Dict[str, Any]]:
    """
    Expands child chunks into their parent section text when available,
    enforcing a strict token/character budget to prevent LLM context overflow.
    Saves child content in 'child_content' so citations remain exact.
    """
    expanded_results: List[Dict[str, Any]] = []
    seen_parent_ids = set()
    total_chars = 0

    for chunk in chunks:
        res_chunk = dict(chunk)
        res_chunk["child_content"] = chunk.get("content", "")
        parent_content = chunk.get("parent_content")
        parent_id = chunk.get("parent_id")

        if parent_content and parent_content.strip():
            if parent_id and parent_id in seen_parent_ids:
                # Parent section was already included by an earlier chunk; keep child chunk
                res_chunk["is_parent_expanded"] = False
                res_chunk["content"] = chunk["content"]
            elif total_chars + len(parent_content) <= max_context_chars:
                res_chunk["content"] = parent_content
                res_chunk["is_parent_expanded"] = True
                if parent_id:
                    seen_parent_ids.add(parent_id)
                total_chars += len(parent_content)
            else:
                # Exceeds budget: fall back to smaller child chunk
                res_chunk["content"] = chunk["content"]
                res_chunk["is_parent_expanded"] = False
                total_chars += len(chunk["content"])
        else:
            res_chunk["content"] = chunk["content"]
            res_chunk["is_parent_expanded"] = False
            total_chars += len(chunk["content"])

        expanded_results.append(res_chunk)

    return expanded_results


def search_relevant_chunks(
    db: Session,
    user_id: str,
    query: str,
    top_k: int = FINAL_TOP_K,
    context_document_ids: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Full upgraded retrieval pipeline:
      1. Hybrid Candidate Retrieval:
         - Bi-encoder dense vector search (Qdrant, top 20)
         - BM25Okapi keyword search (DB, top 20)
         - Reciprocal Rank Fusion (RRF) -> top 20 merged candidates
      2. Stage 1 Timing Log
      3. Cross-Encoder Re-ranking (ms-marco-MiniLM-L-6-v2) -> top 6-8
      4. Stage 2 Timing Log
      5. Parent Context Expansion (budget-capped at ~4000 tokens / 16k chars)
      6. Process / Workflow section expansion fallback
    """
    import time
    if not query.strip():
        return []

    t0 = time.time()
    vector_results = []
    qdrant_available = False

    # 1. Dense vector search
    try:
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
                qdrant_available = True
                vector_results = [
                    r for r in vector_results
                    if not r.get("is_frontmatter")
                    and not is_boilerplate_text(r.get("content", ""), r.get("page", 1))
                ]
    except Exception as ve:
        logger.warning(f"[Retrieval] Qdrant search warning: {ve}")
        vector_results = []

    # 2. BM25 keyword search (with synonym expansion)
    bm25_results = _bm25_search(
        db=db,
        user_id=user_id,
        query=query,
        top_k=QDRANT_CANDIDATE_K,
        context_document_ids=context_document_ids
    )

    # 3. Hybrid Fusion via Reciprocal Rank Fusion (RRF)
    bm25_only_mode = False
    if vector_results and bm25_results:
        candidates = reciprocal_rank_fusion(vector_results, bm25_results, k=60, top_k=QDRANT_CANDIDATE_K)
    elif vector_results:
        candidates = vector_results
    elif bm25_results:
        candidates = bm25_results
        bm25_only_mode = True
    else:
        # Fallback to legacy SQL keyword search if both empty
        candidates = _sql_keyword_candidates(db, user_id, query, QDRANT_CANDIDATE_K, context_document_ids)
        bm25_only_mode = True

    # Adaptive rerank threshold: lower when Qdrant is offline (BM25-only)
    effective_min_score = RERANK_MIN_SCORE_BM25_ONLY if bm25_only_mode else RERANK_MIN_SCORE

    t1 = time.time()
    mode_label = "BM25-ONLY" if bm25_only_mode else "HYBRID"
    logger.info(
        f"[Timing] Stage 1 {mode_label} Retrieval (Dense={len(vector_results)}, BM25={len(bm25_results)}, "
        f"Fused={len(candidates)}, min_score={effective_min_score}) took {t1 - t0:.3f}s"
    )

    if not candidates:
        logger.warning(f"[Retrieval] No candidate chunks found for query: '{query[:60]}'")
        return []

    # 4. Cross-Encoder Re-ranking (with adaptive threshold)
    reranked = rerank_chunks(
        query=query,
        candidates=candidates,
        top_k=top_k,
        min_score=effective_min_score,
    )

    t2 = time.time()
    logger.info(f"[Timing] Stage 2 Cross-Encoder Reranking took {t2 - t1:.3f}s (returned {len(reranked)} chunks, min_score={effective_min_score})")

    if not reranked:
        logger.warning(f"[Retrieval] All candidates failed rerank min_score={effective_min_score}.")
        return []

    # 5. Check if workflow expansion needed
    if is_workflow_query(query):
        expanded = expand_parent_section_chunks(db, reranked, query)
        if expanded and len(expanded) >= 3:
            return apply_parent_context_expansion(expanded)

    # 6. Apply Parent Context Expansion with token budget protection
    final_expanded = apply_parent_context_expansion(reranked)
    return final_expanded


def _sql_keyword_candidates(
    db: Session,
    user_id: str,
    query: str,
    top_k: int,
    context_document_ids: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """Legacy SQL keyword candidate fallback when Qdrant and BM25 are unavailable."""
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

    scored_chunks.sort(key=lambda x: x["score"], reverse=True)

    sql_raw = []
    for item in scored_chunks[:top_k]:
        c = item["chunk"]
        d = item["document"]
        sql_raw.append({
            "document_id": d.id,
            "document_title": d.title,
            "content": c.content,
            "page": c.page_number or 1,
            "page_start": getattr(c, "page_start", c.page_number or 1),
            "page_end": getattr(c, "page_end", c.page_number or 1),
            "chunk_index": c.chunk_index,
            "section_number": c.section_number,
            "section_title": c.section_title,
            "parent_section": c.parent_section,
            "parent_id": getattr(c, "parent_id", None),
            "parent_content": getattr(c, "parent_content", None),
            "score": round(float(item["score"]), 4),
        })
    return sql_raw
