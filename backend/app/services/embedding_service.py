"""
embedding_service.py — Structure-Aware Embedding & Chunking Pipeline
========================================================================
Embedding model : all-MiniLM-L6-v2 (384-dim, same at index + query time)

Structure-aware Chunking Strategy:
  1) Heading Detection: Detects chapters (e.g. "Chapter 7", "Module 1"),
     numbered sub-sections (e.g. "7.1 Problem Formulation", "7.12 Maintenance"),
     and markdown headings ("## Heading").
  2) Hierarchy Tracking: Tracks parent chapter ("Chapter 7 — The Complete ML Workflow")
     and child sub-sections ("7.1", "7.2", ... "7.12").
  3) Self-Contained Section Chunking: Keeps complete sub-sections intact when ≤450 words.
     If a section is larger, splits into paragraph-grouped chunks retaining parent metadata.
  4) Rich Metadata: Attaches section_number, section_title, parent_section to every chunk.
"""
import re
import os
import time
import logging
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

# ── Single source of truth for the embedding model name ──────────────────────
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

_embedding_model = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"[Embedding] Loading model '{EMBEDDING_MODEL_NAME}' ...")
            _embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
            logger.info(f"[Embedding] Model '{EMBEDDING_MODEL_NAME}' loaded successfully.")
        except Exception as e:
            logger.error(f"[Embedding] Failed to load model '{EMBEDDING_MODEL_NAME}': {e}")
            _embedding_model = False
    return _embedding_model if _embedding_model is not False else None


def eager_load_model():
    """Pre-warm the embedding model at startup so the first query is fast."""
    try:
        model = get_embedding_model()
        if model is not None:
            model.encode(["warmup"])
            logger.info(f"[Embedding] Model '{EMBEDDING_MODEL_NAME}' pre-warmed successfully.")
        else:
            logger.warning("[Embedding] Model failed to load during pre-warm.")
    except Exception as e:
        logger.warning(f"[Embedding] Pre-warm failed (non-fatal): {e}")


# ── Heading detection regexes ────────────────────────────────────────────────
# Matches parent chapters: "Chapter 7: Machine Learning Workflow", "Module 1", "Part 2"
_PARENT_HEADER_RE = re.compile(
    r'^(?:Chapter|Module|Part|Section)\s+(\d+[\.\d]*)\s*[:\-\u2013\u2014]?\s*(.*)$',
    re.IGNORECASE
)

# Matches numbered sub-sections: "7.1 Problem Formulation", "7.12 Maintenance", "2.1 What Is ML?"
_SUBSECTION_HEADER_RE = re.compile(
    r'^(\d+(?:\.\d+)+)\s+[:\-\u2013\u2014]?\s*(.+)$'
)

# Matches standalone numbered item: "7.1" or "Step 1:" or "Stage 1:"
_NUMBERED_ITEM_RE = re.compile(
    r'^(?:Step|Stage|Phase|Section)?\s*(\d+(?:\.\d+)*)[\s:\.\u2013\u2014]+(.+)$',
    re.IGNORECASE
)

# General heading line pattern for section splitting
_SECTION_HEADER_PATTERN = re.compile(
    r"""
    (?:^|\n)                                # Start of line
    (?P<header>
        (?:Chapter|Module|Part|Section)\s+\d+.*   # "Chapter 7: Machine Learning Workflow"
        | \d+\.\d+(?:\.\d+)*\s+[A-Z].*            # "7.1 Problem Formulation", "7.12 Maintenance"
        | \#{1,3}\s+\S.*                          # Markdown # H1, ## H2
        | [A-Z][A-Z0-9\s\-\:\.\,\(\)]{6,}(?:\n|$) # ALL-CAPS HEADING LINE
    )
    """,
    re.VERBOSE | re.MULTILINE
)


def parse_heading_info(line: str, current_parent: Optional[str] = None) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Parses a heading line to extract (section_number, section_title, parent_section).

    Examples:
      - "Chapter 7: The Complete Machine Learning Workflow"
        -> section_number="Chapter 7", section_title="The Complete Machine Learning Workflow", parent_section="Chapter 7 — The Complete Machine Learning Workflow"
      - "7.1 Problem Formulation"
        -> section_number="7.1", section_title="Problem Formulation", parent_section=current_parent
    """
    clean_line = line.strip().lstrip("#").strip()
    if not clean_line:
        return None, None, current_parent

    # 1. Check parent chapter pattern
    m_parent = _PARENT_HEADER_RE.match(clean_line)
    if m_parent:
        num_str = f"Chapter {m_parent.group(1)}"
        title_str = m_parent.group(2).strip() or clean_line
        parent_str = f"{num_str} — {title_str}" if title_str != clean_line else clean_line
        return num_str, title_str, parent_str

    # 2. Check subsection pattern e.g. "7.1 Problem Formulation" or "7.12 Maintenance"
    m_sub = _SUBSECTION_HEADER_RE.match(clean_line)
    if m_sub:
        sec_num = m_sub.group(1).strip()
        sec_title = m_sub.group(2).strip()
        return sec_num, sec_title, current_parent

    # 3. Check numbered item pattern e.g. "Step 1: Data Collection"
    m_item = _NUMBERED_ITEM_RE.match(clean_line)
    if m_item:
        sec_num = m_item.group(1).strip()
        sec_title = m_item.group(2).strip()
        return sec_num, sec_title, current_parent

    # 4. Fallback for Markdown or uppercase headers
    words = clean_line.split()
    sec_title = " ".join(words[:6]) if len(words) > 6 else clean_line
    return None, sec_title, current_parent


def chunk_text(
    text: str,
    chunk_size: int = 400,
    overlap: int = 75
) -> List[Dict[str, Any]]:
    """
    Structure-aware chunker that respects document headings, sections, and chapters.

    Process:
      1) Identifies section and chapter boundaries using regex.
      2) Extracts heading metadata: section_number, section_title, parent_section.
      3) Keeps complete sub-sections intact when word count <= chunk_size (or up to ~450 words).
      4) Performs paragraph-grouped splitting only when a section is oversized.
      5) Attaches structural metadata to every chunk for downstream retrieval & ordering.
    """
    chunks: List[Dict[str, Any]] = []
    if not text or not text.strip():
        return chunks

    # Find section header matches and positions
    matches = list(_SECTION_HEADER_PATTERN.finditer(text))

    if not matches:
        # No headings detected — fallback to single section
        raw_chunks = _split_flat_text(text, chunk_size=chunk_size, overlap=overlap)
        for idx, rc in enumerate(raw_chunks):
            chunks.append({
                "chunk_index": idx,
                "content": rc["content"],
                "tokens": rc["tokens"],
                "section_number": None,
                "section_title": None,
                "parent_section": None
            })
        return chunks

    # Build section blocks from header matches
    sections_raw: List[Dict[str, Any]] = []
    for i, m in enumerate(matches):
        start_pos = m.start()
        end_pos = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        header_text = m.group("header").strip()
        block_text = text[start_pos:end_pos].strip()
        sections_raw.append({
            "header_text": header_text,
            "block_text": block_text
        })

    # Include any leading text before the first header
    if matches[0].start() > 0:
        leading_text = text[:matches[0].start()].strip()
        if leading_text:
            sections_raw.insert(0, {
                "header_text": "",
                "block_text": leading_text
            })

    current_parent: Optional[str] = None
    chunk_index = 0

    for s_item in sections_raw:
        header_line = s_item["header_text"]
        block_text = s_item["block_text"]

        if not block_text:
            continue

        # Parse section heading metadata
        sec_num, sec_title, new_parent = parse_heading_info(header_line, current_parent=current_parent)
        if new_parent and new_parent != current_parent:
            current_parent = new_parent

        # Compute word count of this section block
        words = block_text.split()

        # If section is self-contained and reasonably sized (<= 450 words), keep as ONE complete chunk!
        if len(words) <= chunk_size + 50:
            chunks.append({
                "chunk_index": chunk_index,
                "content": block_text,
                "tokens": len(words),
                "section_number": sec_num,
                "section_title": sec_title,
                "parent_section": current_parent
            })
            chunk_index += 1
        else:
            # Oversized section — split with paragraph grouping, keeping metadata on all sub-chunks
            paragraphs = [p.strip() for p in block_text.split("\n\n") if p.strip()]

            if len(paragraphs) > 1:
                current_words: List[str] = []
                overlap_words: List[str] = []

                for para in paragraphs:
                    para_words = para.split()
                    if current_words and len(current_words) + len(para_words) > chunk_size:
                        chunk_str = " ".join(current_words)
                        chunks.append({
                            "chunk_index": chunk_index,
                            "content": chunk_str,
                            "tokens": len(current_words),
                            "section_number": sec_num,
                            "section_title": sec_title,
                            "parent_section": current_parent
                        })
                        chunk_index += 1
                        overlap_words = current_words[-overlap:] if len(current_words) > overlap else current_words[:]
                        current_words = overlap_words[:]

                    current_words.extend(para_words)

                if current_words:
                    chunk_str = " ".join(current_words)
                    chunks.append({
                        "chunk_index": chunk_index,
                        "content": chunk_str,
                        "tokens": len(current_words),
                        "section_number": sec_num,
                        "section_title": sec_title,
                        "parent_section": current_parent
                    })
                    chunk_index += 1
            else:
                # Single large paragraph — flat word-count split
                step = chunk_size - overlap
                for i in range(0, len(words), step):
                    chunk_words = words[i:i + chunk_size]
                    chunk_str = " ".join(chunk_words)
                    chunks.append({
                        "chunk_index": chunk_index,
                        "content": chunk_str,
                        "tokens": len(chunk_words),
                        "section_number": sec_num,
                        "section_title": sec_title,
                        "parent_section": current_parent
                    })
                    chunk_index += 1

    return chunks


def _split_flat_text(text: str, chunk_size: int = 350, overlap: int = 75) -> List[Dict[str, Any]]:
    """Flat fallback chunker when no headings exist."""
    words = text.split()
    chunks = []
    if not words:
        return chunks
    step = chunk_size - overlap
    for i in range(0, len(words), step):
        cw = words[i:i + chunk_size]
        chunks.append({"content": " ".join(cw), "tokens": len(cw)})
    return chunks


def generate_embeddings(texts: List[str], batch_size: int = 32) -> List[List[float]]:
    """
    Generates embeddings using EMBEDDING_MODEL_NAME.
    Logs the model name so index-time model can always be verified in logs.
    """
    model = get_embedding_model()
    if model is None:
        raise RuntimeError(
            f"Embedding model '{EMBEDDING_MODEL_NAME}' is not loaded or failed to initialize."
        )
    if not texts:
        return []

    logger.info(
        f"[Embedding] Generating {len(texts)} embeddings using model='{EMBEDDING_MODEL_NAME}' "
        f"(batch_size={batch_size})"
    )

    try:
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            emb = model.encode(batch, show_progress_bar=False)
            all_embeddings.extend(emb.tolist())
            if len(texts) > batch_size:
                time.sleep(0.005)  # Yield GIL to allow HTTP requests to process
        return all_embeddings
    except Exception as e:
        raise RuntimeError(f"Failed to generate embeddings with '{EMBEDDING_MODEL_NAME}': {e}")
