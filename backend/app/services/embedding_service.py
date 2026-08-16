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


_ABBREVIATIONS = {
    "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "vs", "etc", "fig", "figs",
    "al", "e.g", "i.e", "vol", "no", "dept", "approx", "est", "inc", "ltd", "corp",
    "co", "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec"
}


def split_into_sentences(text: str) -> List[str]:
    """
    Splits text into complete sentences, respecting abbreviations, decimals, and numbered lists.
    Guarantees no sentence is cut mid-thought.
    """
    if not text or not text.strip():
        return []

    cleaned = text.strip()
    # Split on sentence terminals followed by space and an uppercase letter / quote / bracket
    raw_splits = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"\'\(\[])', cleaned)
    sentences: List[str] = []
    buffer = ""

    for part in raw_splits:
        part_str = part.strip()
        if not part_str:
            continue
        if buffer:
            buffer += " " + part_str
        else:
            buffer = part_str

        # Check if the buffer ends on a common abbreviation (e.g. "Fig.", "e.g.", "Dr.")
        last_word_match = re.search(r'\b([a-zA-Z\.]+)\s*$', buffer)
        if last_word_match:
            last_word = last_word_match.group(1).lower().rstrip('.')
            if last_word in _ABBREVIATIONS or re.search(r'^\d+\.$', last_word_match.group(1)):
                continue

        sentences.append(buffer)
        buffer = ""

    if buffer:
        sentences.append(buffer)

    return [s.strip() for s in sentences if s.strip()]


_TOC_DOTS_PATTERN = re.compile(r'(\.{3,}|\.\s+\.\s+\.\s+\.|\u2026)')
_PAGE_NUMBER_END_PATTERN = re.compile(r'\b\d+\s*$', re.MULTILINE)


def is_low_information_chunk(text: str, page_number: int = 1) -> bool:
    """
    Identifies chunks that contain mostly structural/meta text rather than substantive prose:
    - Table-of-contents lines (repeated dot leaders . . . . 18, lists of chapter numbers with page numbers)
    - Standalone headers with no body prose (<15 words, or <30 words without sentence punctuation)
    - Fragmentary lines with <15 words and no mathematical formulas or code blocks
    - Legal/copyright publishing frontmatter
    """
    if not text or not text.strip():
        return True

    clean = text.strip()
    words = clean.split()
    word_count = len(words)

    # 1. Check for Table-of-Contents leader dots (e.g. "1.1 The Meaning of Intelligence . . . . 8")
    if _TOC_DOTS_PATTERN.search(clean):
        toc_lines = [
            ln for ln in clean.splitlines()
            if _TOC_DOTS_PATTERN.search(ln) or re.search(r'\d+\.\d+.*\s+\d+$', ln.strip())
        ]
        if len(toc_lines) >= 1 and (word_count < 80 or len(toc_lines) >= len(clean.splitlines()) * 0.3):
            return True

    # 2. Check for Table of Contents header on early pages (pages 1-10)
    if (page_number or 1) <= 10:
        if re.search(r'^(?:table of contents|contents|brief contents)\b', clean, re.IGNORECASE) and word_count < 80:
            return True

    # 3. Check for standalone headers or tiny non-substantive fragments (< 15 words)
    if word_count < 15:
        has_formula = "$" in clean or "\\theta" in clean or "\\sum" in clean or "\\nabla" in clean
        has_code = "```" in clean or "def " in clean or "class " in clean
        if not has_formula and not has_code:
            return True

    # Standalone header (< 30 words without any ending sentence punctuation like . ! ?)
    if word_count < 30 and not re.search(r'[.!?]["\']?\s*$', clean):
        has_formula = "$" in clean or "\\theta" in clean or "\\sum" in clean or "\\nabla" in clean
        has_code = "```" in clean or "def " in clean or "class " in clean
        if not has_formula and not has_code:
            return True

    # 4. Check for copyright / legal publishing frontmatter
    legal_terms = [
        "isbn", "copyright", "all rights reserved", "printed in",
        "publisher", "proofreader", "editor:", "cataloging-in-publication",
        "trademarks", "library of congress", "sans serif", "typeset", "published by"
    ]
    t_lower = clean.lower()
    matches = sum(1 for kw in legal_terms if kw in t_lower)
    if (page_number or 1) <= 3 and matches >= 1:
        return True
    if matches >= 2:
        return True

    return False


def build_contextual_chunk_header(
    doc_title: str,
    section_title: Optional[str] = None,
    section_num: Optional[str] = None
) -> str:
    """Creates a short header combining document title and nearest section heading."""
    title = (doc_title or "Document").strip()
    sec = (section_title or section_num or "General").strip()
    return f"[{title} — {sec}]"


def build_embedding_input(
    doc_title: str,
    section_title: Optional[str],
    section_num: Optional[str],
    chunk_content: str
) -> str:
    """
    Prepends contextual header to chunk text purely for generating embeddings.
    Original raw chunk_content is stored in DB/payload for user viewing.
    """
    header = build_contextual_chunk_header(doc_title, section_title, section_num)
    return f"{header}\n{chunk_content.strip()}"


def _split_paragraph_by_sentences(
    para: str,
    chunk_size: int = 450,
    overlap_words: int = 65
) -> List[str]:
    """Splits an oversized paragraph into complete sentence chunks."""
    sentences = split_into_sentences(para)
    if not sentences:
        return [para] if para.strip() else []

    chunks: List[str] = []
    current_sentences: List[str] = []
    current_word_count = 0

    for sent in sentences:
        sent_words = len(sent.split())
        if current_sentences and current_word_count + sent_words > chunk_size:
            chunk_str = " ".join(current_sentences).strip()
            if chunk_str:
                chunks.append(chunk_str)

            # Build sentence overlap for continuity
            overlap_sents: List[str] = []
            overlap_count = 0
            for prev_sent in reversed(current_sentences):
                s_words = len(prev_sent.split())
                if overlap_count + s_words <= overlap_words or not overlap_sents:
                    overlap_sents.insert(0, prev_sent)
                    overlap_count += s_words
                else:
                    break

            current_sentences = overlap_sents[:]
            current_word_count = sum(len(s.split()) for s in current_sentences)

        current_sentences.append(sent)
        current_word_count += sent_words

    if current_sentences:
        chunk_str = " ".join(current_sentences).strip()
        if chunk_str:
            chunks.append(chunk_str)

    return chunks


def chunk_text(
    text: str,
    page_number: int = 1,
    chunk_size: int = 450,
    overlap: int = 65,
    doc_title: str = "Document",
    filter_low_info: bool = True
) -> List[Dict[str, Any]]:
    """
    Structure-aware chunker that respects document headings, paragraph boundaries, and sentence terminals.
    Ensures chunk boundaries ALWAYS land on complete sentences, never cutting mid-sentence.
    Generates parent-child links grouping consecutive chunks into parent sections.
    Optionally filters out low-information meta/TOC chunks (filter_low_info=True).
    """
    chunks: List[Dict[str, Any]] = []
    if not text or not text.strip():
        return chunks

    matches = list(_SECTION_HEADER_PATTERN.finditer(text))

    if not matches:
        # No headings detected — split by paragraphs and sentences
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        raw_text_chunks: List[str] = []

        for para in paragraphs:
            p_words = len(para.split())
            if p_words > chunk_size:
                raw_text_chunks.extend(_split_paragraph_by_sentences(para, chunk_size=chunk_size, overlap_words=overlap))
            else:
                raw_text_chunks.append(para)

        # Merge small consecutive paragraphs up to chunk_size
        merged_chunks: List[str] = []
        curr_block: List[str] = []
        curr_words = 0

        for item in raw_text_chunks:
            item_words = len(item.split())
            if curr_block and curr_words + item_words > chunk_size:
                merged_chunks.append("\n\n".join(curr_block))
                curr_block = [item]
                curr_words = item_words
            else:
                curr_block.append(item)
                curr_words += item_words

        if curr_block:
            merged_chunks.append("\n\n".join(curr_block))

        # Build parent grouping (combine every 3 child chunks)
        parent_group_size = 3
        for idx, content in enumerate(merged_chunks):
            parent_idx = idx // parent_group_size
            parent_id = f"parent_{page_number}_{parent_idx}"
            parent_slice = merged_chunks[parent_idx * parent_group_size : (parent_idx + 1) * parent_group_size]
            parent_content = "\n\n".join(parent_slice)
            is_low_info = is_low_information_chunk(content, page_number=page_number)

            if filter_low_info and is_low_info:
                continue

            chunks.append({
                "chunk_index": idx,
                "content": content,
                "tokens": len(content.split()),
                "page_number": page_number,
                "page_start": page_number,
                "page_end": page_number,
                "section_number": None,
                "section_title": None,
                "parent_section": None,
                "parent_id": parent_id,
                "parent_content": parent_content,
                "is_low_information": is_low_info,
                "embedding_input": build_embedding_input(doc_title, None, None, content)
            })
        return chunks

    # Headings detected: build section blocks
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

    if matches[0].start() > 0:
        leading_text = text[:matches[0].start()].strip()
        if leading_text:
            sections_raw.insert(0, {
                "header_text": "",
                "block_text": leading_text
            })

    current_parent: Optional[str] = None
    chunk_index = 0

    for sec_idx, s_item in enumerate(sections_raw):
        header_line = s_item["header_text"]
        block_text = s_item["block_text"]

        if not block_text:
            continue

        sec_num, sec_title, new_parent = parse_heading_info(header_line, current_parent=current_parent)
        if new_parent and new_parent != current_parent:
            current_parent = new_parent

        words = block_text.split()
        section_parent_id = f"sec_parent_{page_number}_{sec_idx}"
        section_parent_content = block_text

        # If section is reasonably sized (<= 450 words), keep as ONE intact chunk
        if len(words) <= chunk_size + 50:
            is_low_info = is_low_information_chunk(block_text, page_number=page_number)
            if filter_low_info and is_low_info:
                continue

            chunks.append({
                "chunk_index": chunk_index,
                "content": block_text,
                "tokens": len(words),
                "page_number": page_number,
                "page_start": page_number,
                "page_end": page_number,
                "section_number": sec_num,
                "section_title": sec_title,
                "parent_section": current_parent,
                "parent_id": section_parent_id,
                "parent_content": section_parent_content,
                "is_low_information": is_low_info,
                "embedding_input": build_embedding_input(doc_title, sec_title, sec_num, block_text)
            })
            chunk_index += 1
        else:
            # Oversized section: split on paragraph and sentence boundaries
            paragraphs = [p.strip() for p in block_text.split("\n\n") if p.strip()]
            sec_child_chunks: List[str] = []

            for p in paragraphs:
                if len(p.split()) > chunk_size:
                    sec_child_chunks.extend(_split_paragraph_by_sentences(p, chunk_size=chunk_size, overlap_words=overlap))
                else:
                    sec_child_chunks.append(p)

            # Merge smaller paragraphs to target chunk_size
            merged_sec_chunks: List[str] = []
            curr_sec_block: List[str] = []
            curr_sec_words = 0

            for sc in sec_child_chunks:
                sc_words = len(sc.split())
                if curr_sec_block and curr_sec_words + sc_words > chunk_size:
                    merged_sec_chunks.append("\n\n".join(curr_sec_block))
                    curr_sec_block = [sc]
                    curr_sec_words = sc_words
                else:
                    curr_sec_block.append(sc)
                    curr_sec_words += sc_words

            if curr_sec_block:
                merged_sec_chunks.append("\n\n".join(curr_sec_block))

            for sc_content in merged_sec_chunks:
                is_low_info = is_low_information_chunk(sc_content, page_number=page_number)
                if filter_low_info and is_low_info:
                    continue

                chunks.append({
                    "chunk_index": chunk_index,
                    "content": sc_content,
                    "tokens": len(sc_content.split()),
                    "page_number": page_number,
                    "page_start": page_number,
                    "page_end": page_number,
                    "section_number": sec_num,
                    "section_title": sec_title,
                    "parent_section": current_parent,
                    "parent_id": section_parent_id,
                    "parent_content": section_parent_content,
                    "is_low_information": is_low_info,
                    "embedding_input": build_embedding_input(doc_title, sec_title, sec_num, sc_content)
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
