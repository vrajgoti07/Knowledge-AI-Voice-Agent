import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            _embedding_model = False
    return _embedding_model if _embedding_model is not False else None


def eager_load_model():
    """Pre-warm the embedding model at startup so the first query is fast."""
    try:
        model = get_embedding_model()
        if model is not None:
            # Run a tiny dummy encode to fully warm JIT/ONNX caches
            model.encode(["warmup"])
            logger.info("[Embedding] Model 'all-MiniLM-L6-v2' pre-warmed successfully.")
        else:
            logger.warning("[Embedding] Model failed to load during pre-warm.")
    except Exception as e:
        logger.warning(f"[Embedding] Pre-warm failed (non-fatal): {e}")


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 75) -> List[Dict[str, Any]]:
    """
    Smart chunker:
    1. First tries to split on paragraph/section breaks (double newlines).
    2. Groups consecutive paragraphs into ~300-500 word chunks with ~50-100 word overlap.
    3. Falls back to flat word-count chunking if no paragraph breaks are found.
    """
    chunks = []
    if not text:
        return chunks

    # --- Try paragraph-aware splitting first ---
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    if len(paragraphs) > 1:
        # Paragraph-aware chunking
        current_words: List[str] = []
        chunk_index = 0
        overlap_words: List[str] = []

        for para in paragraphs:
            para_words = para.split()

            # If adding this paragraph would exceed chunk_size, flush first
            if current_words and len(current_words) + len(para_words) > chunk_size:
                chunk_str = " ".join(current_words)
                chunks.append({
                    "chunk_index": chunk_index,
                    "content": chunk_str,
                    "tokens": len(current_words),
                })
                chunk_index += 1
                # Keep overlap from the end of the flushed chunk
                overlap_words = current_words[-overlap:] if len(current_words) > overlap else current_words[:]
                current_words = overlap_words[:]

            current_words.extend(para_words)

        # Flush any remaining words
        if current_words:
            chunk_str = " ".join(current_words)
            chunks.append({
                "chunk_index": chunk_index,
                "content": chunk_str,
                "tokens": len(current_words),
            })

        if chunks:
            return chunks

    # --- Fallback: flat word-count chunking (original logic, tighter params) ---
    words = text.split()
    if len(words) <= chunk_size:
        return [{"chunk_index": 0, "content": text, "tokens": len(words)}]

    step = chunk_size - overlap
    for i in range(0, len(words), step):
        chunk_words = words[i:i + chunk_size]
        chunk_str = " ".join(chunk_words)
        chunks.append({
            "chunk_index": len(chunks),
            "content": chunk_str,
            "tokens": len(chunk_words),
        })

    return chunks


import time

def generate_embeddings(texts: List[str], batch_size: int = 32) -> List[List[float]]:
    model = get_embedding_model()
    if model is None:
        raise RuntimeError("Embedding model (sentence-transformers) is not loaded or failed to initialize.")
    if not texts:
        return []
    try:
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            emb = model.encode(batch, show_progress_bar=False)
            all_embeddings.extend(emb.tolist())
            if len(texts) > batch_size:
                time.sleep(0.005)  # Yield GIL to allow HTTP requests/health probes to process
        return all_embeddings
    except Exception as e:
        raise RuntimeError(f"Failed to generate embeddings: {e}")
