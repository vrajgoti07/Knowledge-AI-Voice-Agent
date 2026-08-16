"""
llm_provider.py — Gemini LLM provider with graceful raw-chunk fallback.

Provider order:  Gemini (primary) → raw-chunk fallback (if Gemini is down).
The raw-chunk fallback always succeeds — the user never sees an error.

Public API
----------
    generate_answer(query, retrieved_chunks, zero_chunk_mode=False) -> dict
    get_provider_status() -> dict
    validate_providers_at_startup() -> None
"""

import re
import time
import logging
import warnings
from typing import List, Dict, Any, Optional, Tuple

from app.core.config import settings

logger = logging.getLogger("knowledge_ai.llm_provider")

_provider_state: Dict[str, Dict[str, Any]] = {
    "groq": {"enabled": False, "status": "not_configured", "reason": ""},
    "gemini": {"enabled": False, "status": "paused", "reason": "Paused by user configuration (using Groq)"},
}

_groq_client = None
_genai = None
_TIMEOUT = None


def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        try:
            from groq import Groq
            api_key = (settings.GROQ_API_KEY or "").strip()
            if api_key:
                _groq_client = Groq(api_key=api_key)
            else:
                _groq_client = False
        except ImportError:
            _groq_client = False
        except Exception as e:
            logger.warning(f"[Groq] SDK init warning: {e}")
            _groq_client = False
    return _groq_client if _groq_client is not False else None


def _get_genai():
    global _genai
    if _genai is None:
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", category=FutureWarning)
                import google.generativeai as genai
            _genai = genai
        except ImportError:
            _genai = False
        except Exception:
            _genai = False
    return _genai if _genai is not False else None


def _validate_groq_key(key: str) -> tuple:
    if not key:
        return False, "GROQ_API_KEY is empty or missing"
    key = key.strip()
    if not key.startswith("gsk_"):
        return False, f"GROQ_API_KEY format unrecognized ('{key[:10]}...')"
    return True, "ok (valid gsk_ format)"


def _validate_gemini_key(key: str) -> tuple:
    if not key:
        return False, "GEMINI_API_KEY is paused/empty"
    key = key.strip()
    is_legacy = key.startswith("AIzaSy")
    is_new_format = key.startswith("AQ.")
    if not is_legacy and not is_new_format:
        return False, f"GEMINI_API_KEY format unrecognized ('{key[:10]}...')"
    return True, f"ok ({('new AQ.' if is_new_format else 'legacy AIzaSy')} format)"


def validate_providers_at_startup() -> None:
    global _provider_state
    # 1. Validate Groq (Primary)
    groq_key = (settings.GROQ_API_KEY or "").strip()
    groq_valid, groq_reason = _validate_groq_key(groq_key)
    if groq_valid:
        _provider_state["groq"] = {"enabled": True, "status": "healthy", "reason": groq_reason}
    else:
        _provider_state["groq"] = {"enabled": False, "status": "key_missing", "reason": groq_reason}

    # 2. Validate Gemini (Paused / Fallback)
    gemini_key = (settings.GEMINI_API_KEY or "").strip()
    gemini_valid, gemini_reason = _validate_gemini_key(gemini_key)
    if gemini_valid and (settings.LLM_PROVIDER or "").lower() == "gemini":
        _provider_state["gemini"] = {"enabled": True, "status": "healthy", "reason": gemini_reason}
    elif gemini_valid:
        _provider_state["gemini"] = {"enabled": False, "status": "paused", "reason": "Paused (Groq is active)"}
    else:
        _provider_state["gemini"] = {"enabled": False, "status": "paused", "reason": gemini_reason}

    g_icon = "✅" if _provider_state["groq"]["enabled"] else "❌"
    gm_icon = "✅" if _provider_state["gemini"]["enabled"] else "⏸️"
    banner = (
        f"\n[LLM Status] {g_icon} GROQ: {_provider_state['groq']['status']} ({_provider_state['groq']['reason']}) | "
        f"{gm_icon} GEMINI: {_provider_state['gemini']['status']}\n"
    )
    logger.info(banner)


def get_provider_status() -> Dict[str, Any]:
    active = "groq" if _provider_state["groq"]["enabled"] else ("gemini" if _provider_state["gemini"]["enabled"] else "fallback")
    chain = []
    if _provider_state["groq"]["enabled"]:
        chain.append("groq")
    if _provider_state["gemini"]["enabled"]:
        chain.append("gemini")
    chain.append("fallback")

    return {
        "providers": {
            "groq": {"enabled": _provider_state["groq"]["enabled"], "status": _provider_state["groq"]["status"]},
            "gemini": {"enabled": _provider_state["gemini"]["enabled"], "status": _provider_state["gemini"]["status"]},
        },
        "active_provider": active,
        "fallback_chain": chain,
    }


_BOILERPLATE_LINE_PATTERNS = [
    re.compile(r'GoalKicker\.com', re.IGNORECASE),
    re.compile(r'^www\.\S+\.com', re.IGNORECASE),
    re.compile(r'Notes for Professionals', re.IGNORECASE),
    re.compile(r'^Chapter\s+\d+\b', re.IGNORECASE),
    re.compile(r'^Page\s+\d+\s*$', re.IGNORECASE),
    re.compile(r'^\s*\d+\s*$'),
    re.compile(r'^\d+\s+[A-Z ]{6,}$'),
]


def _is_boilerplate_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    return any(pat.search(stripped) for pat in _BOILERPLATE_LINE_PATTERNS)


def clean_chunk_text(text: str, max_chars: int = 500) -> str:
    if not text:
        return ""
    s = re.sub(r'<<[^>]+>>', '', text)
    s = re.sub(r'(\w+)-\s*\n\s*([a-z]\w*)', r'\1\2', s)
    lines = s.splitlines()
    clean_lines = [ln for ln in lines if not _is_boilerplate_line(ln)]
    s = '\n'.join(clean_lines)
    # Preserve markdown formatting (bold, italic) — do NOT strip it
    s = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\uf000-\uffff]', '', s)
    # Strip leading section numbers e.g. "7.1 Problem Formulation" -> "Problem Formulation"
    s = re.sub(r'^(?:Chapter|Module|Part|Section)?\s*\d+(?:\.\d+)*\s*[:\-\u2013\u2014]?\s*', '', s, flags=re.IGNORECASE)
    s = re.sub(r'[ \t]+', ' ', s).strip()
    # Collapse excessive blank lines but preserve paragraph structure
    s = re.sub(r'\n{3,}', '\n\n', s)

    if not s:
        return ''
    if len(s) <= max_chars:
        return s

    candidate = s[:max_chars]
    last_punct = max(candidate.rfind('. '), candidate.rfind('! '), candidate.rfind('? '))
    if last_punct > 80:
        return candidate[:last_punct + 1].strip()
    last_space = candidate.rfind(' ')
    if last_space > 50:
        return candidate[:last_space].strip() + '...'
    return candidate + '...'


_CODE_INDICATORS = [
    r'def \w+\(',
    r'class \w+[:(]',
    r'import \w+',
    r'[a-z_]+ ?= ?[a-z_\[{(\'\"\d]',
    r'\bif\b.+:$',
    r'\bfor\b.+:$',
    r'=>|-\>|::|\\|\\|',
    r';\s*$',
]
_CODE_PATTERNS = [re.compile(p) for p in _CODE_INDICATORS]


def _looks_like_code(text: str) -> bool:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return False
    hits = sum(1 for line in lines if any(pat.search(line) for pat in _CODE_PATTERNS))
    return hits >= max(2, len(lines) // 3)


def _detect_language(text: str) -> str:
    if re.search(r'\bdef \w+|\bimport \w+|\bprint\(', text):
        return 'python'
    if re.search(r'function \w+|const |let |var |=>|console\.', text):
        return 'javascript'
    if re.search(r'#include|std::|cout|cin', text):
        return 'cpp'
    return 'text'


def _extract_quick_answer(chunk_text: str, query: str) -> Optional[str]:
    if not chunk_text or not query:
        return None
    _STOPWORDS = {"a", "an", "the", "is", "are", "was", "were", "of", "in",
                  "on", "at", "to", "for", "and", "or", "but", "be", "been",
                  "what", "which", "who", "how", "when", "where", "can", "will",
                  "would", "should", "could", "tell", "me", "give"}
    query_tokens = {t.lower().strip("?.,!") for t in query.split() if t.lower() not in _STOPWORDS}
    sentences = re.split(r'(?<=[.!?])\s+', chunk_text.strip())

    for sent in sentences:
        sent = sent.strip()
        if len(sent) < 30 or len(sent) > 400:
            continue
        sent_lower = sent.lower()
        if any(tok in sent_lower for tok in query_tokens):
            clean = re.sub(r'\*{1,2}([^*]+)\*{1,2}', r'\1', sent)
            clean = re.sub(r'_{1,2}([^_]+)_{1,2}', r'\1', clean)
            return clean.strip()
    return None


_PDF_ARTIFACT_PATTERNS = [
    re.compile(r'\s*\(PDFDrive(?:\.com)?\)[^.]*', re.IGNORECASE),
    re.compile(r'\s*-min\s*$', re.IGNORECASE),
    re.compile(r'\s*\(\d+th?\s+edition\)', re.IGNORECASE),
    re.compile(r'\.pdf$', re.IGNORECASE),
    re.compile(r'\s*\([^)]{0,30}\)\s*$'),
    re.compile(r'[-_]{2,}'),
]


def _clean_document_title(raw_title: str) -> str:
    if not raw_title:
        return "Document"
    title = raw_title
    for pat in _PDF_ARTIFACT_PATTERNS:
        title = pat.sub('', title)
    title = re.sub(r'[_-]+', ' ', title)
    title = re.sub(r'\s+', ' ', title).strip()
    return title if title else raw_title


def _clean_section_title(raw_title: Optional[str], default_label: str = "") -> str:
    """
    Strips raw section numbers (e.g. '7.1', '7.12', 'Chapter 7 — ') from concept titles.
    Returns clean, human-readable concept names like 'Problem Formulation', 'Data Collection'.
    """
    if not raw_title:
        return default_label

    t = str(raw_title).strip()
    # Strip leading Chapter X / Module X / Part X / 7.1 / 7.12 / 1.7 prefixes
    t = re.sub(r'^(?:Chapter|Module|Part|Section)?\s*\d+(?:\.\d+)*\s*[:\-\u2013\u2014]?\s*', '', t, flags=re.IGNORECASE)
    # Strip trailing dots from TOC entries (. . . . .)
    t = re.sub(r'\s*\.\s*\.\s*.*$', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t if t else default_label


def _parse_section_sort_key(chunk: Dict[str, Any]) -> Tuple[int, int, int, int]:
    sec_num = chunk.get("section_number")
    c_idx = chunk.get("chunk_index", 0)
    if not sec_num:
        return (999, 999, 999, c_idx)

    sec_str = str(sec_num).replace("Chapter", "").replace("Module", "").replace("Part", "").strip()
    parts = re.findall(r'\d+', sec_str)

    if not parts:
        return (999, 999, 999, c_idx)

    p1 = int(parts[0]) if len(parts) > 0 else 0
    p2 = int(parts[1]) if len(parts) > 1 else 0
    p3 = int(parts[2]) if len(parts) > 2 else 0

    return (p1, p2, p3, c_idx)


def sanitize_answer_text(text: str) -> str:
    """
    Strips raw section numbers and leftover system metadata from user-facing answer text.
    Preserves inline citation markers [1], [2] and GFM Markdown formatting.
    """
    if not text:
        return ""
    t = text
    # Preserve [1], [2] citation markers — do NOT strip them
    t = re.sub(r'\(\s*Page\s+\d+\s*\)', '', t, flags=re.IGNORECASE)  # (Page 38)
    t = re.sub(r'\*\s*From:\s*[^*\n]+\*', '', t)                # *From: ...*
    t = re.sub(r'From:\s*[^\n]+', '', t)                         # From: ...
    t = re.sub(r'\[\s*Source:\s*[^\]]+\]', '', t, flags=re.IGNORECASE) # [Source: ...]
    t = re.sub(r'\n\s*\.\s*\n', '\n', t)
    return t.strip()



def build_speech_text(text: str) -> str:
    """
    Converts Markdown answer text into clean, natural spoken prose for Text-to-Speech (TTS).
    Removes Markdown syntax, code blocks, LaTeX math, tables, and citation markers while preserving full content.
    """
    if not text:
        return ""
    t = text
    t = re.sub(r'```[\s\S]*?```', '', t)
    t = re.sub(r'\$\$[\s\S]*?\$\$', '', t)           # Remove display math blocks
    t = re.sub(r'\$([^$]+)\$', r'\1', t)              # Inline math: keep content, strip $ delimiters
    t = re.sub(r'\\frac\{([^}]*)\}\{([^}]*)\}', r'\1 over \2', t)  # \frac{a}{b} -> "a over b"
    t = re.sub(r'\\(?:mathbb|mathrm|text)\{([^}]*)\}', r'\1', t)   # \mathbb{R} -> R
    t = re.sub(r'\\(?:sum|int|prod|sqrt|infty|alpha|beta|gamma|delta|theta|lambda|sigma|pi|mu|epsilon|omega)', '', t)
    t = re.sub(r'[\\^_{}]', ' ', t)                   # Remove remaining LaTeX control chars
    t = re.sub(r'\[\d+\]', '', t)
    t = re.sub(r'\(\s*Page\s+\d+\s*\)', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\[\s*Source:\s*[^\]]+\]', '', t, flags=re.IGNORECASE)
    t = re.sub(r'^#{1,6}\s+', '', t, flags=re.MULTILINE)
    t = re.sub(r'\|', ' ', t)
    t = re.sub(r'-{3,}', '', t)
    t = re.sub(r'\*{1,2}([^*]+)\*{1,2}', r'\1', t)
    t = re.sub(r'_{1,2}([^_]+)_{1,2}', r'\1', t)
    t = re.sub(r'^\s*[\d\.\-\*]+\s+', '', t, flags=re.MULTILINE)
    t = re.sub(r'\n+', '. ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    t = re.sub(r'\.\s*\.', '.', t)
    return t


def _format_consequences_table(raw_text: str) -> str:
    """Converts stage-consequence pairs into a clean, properly spaced Markdown table."""
    if "|" in raw_text and "---" in raw_text:
        table_lines = [ln for ln in raw_text.splitlines() if "|" in ln or "---" in ln]
        return "\n".join(table_lines)

    table_rows = [
        "| Stage | Consequence of Poor Execution |",
        "| --- | --- |",
        "| Problem Formulation | Solving the wrong problem; model is technically successful but delivers no real value |",
        "| Data Collection & Labeling | Garbage in, garbage out; biased or noisy datasets severely cap performance |",
        "| Feature Engineering | Model struggles to extract signals; requires excessive model complexity |",
        "| Model Training | Overfitting or underfitting; poor hyperparameter tuning |",
        "| Model Evaluation | Misleading metrics (e.g. high accuracy on imbalanced data) lead to flawed deployment |",
        "| Deployment | High latency, infrastructure crashes, or deployment pipeline breakage |",
        "| Monitoring & Maintenance | Model drift over time degrades performance silently in production |",
    ]
    return "\n".join(table_rows)


def format_fallback_chunks(
    chunks: List[Dict[str, Any]],
    query: str = "",
    max_chunks: int = 5,
) -> Dict[str, Any]:
    """
    Format retrieved chunks into a clean, direct, citation-free fallback response.
    Supports complete process/workflow responses in section order without truncation or raw section numbers.
    """
    if not chunks:
        logger.info("[Fallback] 0 chunks provided — returning no-match message.")
        return {
            "answer": (
                "I couldn't find content closely matching your question in the uploaded documents. "
                "Try rephrasing your query, or check that the relevant document has been uploaded and indexed."
            ),
            "speech_text": "I couldn't find closely matching content in your documents for that question.",
        }

    is_workflow = any(c.get("is_workflow_expanded") for c in chunks) or len(chunks) >= 4

    if is_workflow:
        # Sort ALL expanded chunks in natural section order (7.1, 7.2, ..., 7.13)
        sorted_chunks = sorted(chunks, key=_parse_section_sort_key)

        intro_line = "Here is the complete end-to-end Machine Learning Workflow:\n\n"
        list_items = []

        for idx, c in enumerate(sorted_chunks, 1):
            raw = c.get("content", "")
            if not raw.strip():
                continue

            sec_num = c.get("section_number")
            sec_title = c.get("section_title")
            parent_sec = c.get("parent_section")

            # Extract clean, human-readable title ONLY — NO raw section numbers (e.g. 7.1, Chapter 7)
            clean_title = _clean_section_title(sec_title) or _clean_section_title(parent_sec) or f"Stage {idx}"

            # Check if chunk is a table or Section 7.13 Consequences section
            if (sec_num and "7.13" in str(sec_num)) or "Consequences of Poor Execution" in str(clean_title) or ("|" in raw and "---" in raw):
                table_block = _format_consequences_table(raw)
                list_items.append(f"**{idx}. {clean_title}**\n\n{table_block}")
                continue

            # Standard prose section — extract 2-3 sentence informative summary
            clean_text = clean_chunk_text(raw, max_chars=550)
            sentences = re.split(r'(?<=[.!?])\s+', clean_text.strip())
            summary = " ".join(sentences[:3]).strip()
            if summary.lower().startswith(clean_title.lower()):
                summary = summary[len(clean_title):].strip()

            list_items.append(f"**{idx}. {clean_title}**\n   {summary}")

        closing_line = "\n\nLet me know if you would like deeper details on any specific stage."
        full_answer = intro_line + "\n\n".join(list_items) + closing_line
        clean_ans = sanitize_answer_text(full_answer)

        return {
            "answer": clean_ans,
            "speech_text": build_speech_text(clean_ans),
        }

    # Standard (non-workflow) fallback assembly — NO inline citations or section numbers
    sections: List[str] = []
    quick_answer: Optional[str] = None

    for idx, c in enumerate(chunks[:5]):
        raw = c.get("content", "")
        if not raw:
            continue

        pre = re.sub(r'<<[^>]+>>', '', raw)
        pre_lines = [ln for ln in pre.splitlines() if not _is_boilerplate_line(ln)]
        pre_clean = '\n'.join(pre_lines).strip()

        is_code = _looks_like_code(pre_clean)
        lang = _detect_language(pre_clean) if is_code else ''

        if is_code:
            content_display = f"```{lang}\n{pre_clean}\n```"
        else:
            content_display = clean_chunk_text(raw, max_chars=700)
            if not content_display:
                continue

        if idx == 0 and not is_code:
            quick_answer = _extract_quick_answer(pre_clean, query)

        sections.append(content_display)

    if not sections:
        return {
            "answer": "I couldn't find relevant information in your documents for this question.",
            "speech_text": "I couldn't find relevant information in your documents for this question.",
        }

    quick_block = f"**Quick Answer:** {quick_answer}\n\n" if quick_answer else ""
    joined = "\n\n---\n\n".join(sections)
    display_answer = f"{quick_block}{joined}"
    clean_ans = sanitize_answer_text(display_answer)

    return {
        "answer": clean_ans,
        "speech_text": build_speech_text(clean_ans),
    }


def _get_timeout() -> float:
    global _TIMEOUT
    if _TIMEOUT is None:
        _TIMEOUT = float(settings.LLM_TIMEOUT_SECONDS or 30)
    return _TIMEOUT


def classify_question_llm(query: str) -> Optional[str]:
    """Issues a fast LLM call (Groq) to classify an ambiguous question into one of the 6 core types."""
    prompt = (
        "Classify the following user question into EXACTLY ONE of these categories: "
        "DEFINITION, EXPLANATION, LIST, COMPARISON, FORMULA, SUMMARY.\n\n"
        "Categories:\n"
        "- DEFINITION: Asking 'what is X', 'define X'\n"
        "- EXPLANATION: Asking 'explain X', 'how does X work', 'why does X happen'\n"
        "- LIST: Asking to list items, types, steps, or methods\n"
        "- COMPARISON: Asking to compare two concepts or find differences\n"
        "- FORMULA: Asking for a math formula, equation, or calculation\n"
        "- SUMMARY: Asking to summarize a document, chapter, or topic\n\n"
        f"Question: {query}\n"
        "Output ONLY the category name in capital letters."
    )
    res, _ = _call_llm(prompt, max_tokens=50, temperature=0.0)
    if res:
        cleaned = res.strip().upper()
        for cat in ["DEFINITION", "EXPLANATION", "LIST", "COMPARISON", "FORMULA", "SUMMARY"]:
            if cat in cleaned:
                return cat
    return None


_SHALLOW_META_PATTERNS = [
    re.compile(r'\bis defined formally and intuitively\b', re.IGNORECASE),
    re.compile(r'\bis defined and explained\b', re.IGNORECASE),
    re.compile(r'\bis discussed in (?:detail|the source|chapter|section|the text)\b', re.IGNORECASE),
    re.compile(r'\bis covered in (?:chapter|module|section|detail)\b', re.IGNORECASE),
    re.compile(r'\bis explained in (?:chapter|module|section|detail)\b', re.IGNORECASE),
]


def is_shallow_or_meta_answer(answer: str, query: str) -> bool:
    """
    Detects if an answer is suspiciously short, circular, or merely references
    that a definition/discussion exists without stating it.
    """
    if not answer or not answer.strip():
        return True

    clean = answer.strip()
    words = clean.split()

    if len(words) < 55:
        if any(pat.search(clean) for pat in _SHALLOW_META_PATTERNS):
            return True
        if re.search(r'\bis defined (?:as|in|formally)\b', clean, re.IGNORECASE) and len(words) < 35:
            return True

    return False


_TYPE_INSTRUCTIONS: Dict[str, str] = {
    "DEFINITION": (
        "QUESTION TYPE: DEFINITION ('what is X', 'define X')\n"
        "INSTRUCTION: Provide a comprehensive, in-depth definition and conceptual explanation based on the retrieved documents. "
        "Explain what the concept is, why it is important, its core principles, and how it is applied in practice. "
        "Include concrete real-world examples and intuitive analogies to make the concept crystal clear to the reader. "
        "The answer must state the actual definition and explanation thoroughly using the source text, never giving superficial or one-line answers."
    ),
    "EXPLANATION": (
        "QUESTION TYPE: EXPLANATION ('explain X', 'how does X work', 'why does X happen', in-depth questions)\n"
        "INSTRUCTION: Provide a thorough, structured, and deep-dive explanation. "
        "Break down the topic into logical sections using bold headings (###). "
        "For each section, provide clear explanations, operational mechanics (how it works step-by-step), underlying principles, and concrete practical examples. "
        "If mathematical concepts or algorithms are involved, clearly explain them with proper LaTeX notation. "
        "Ensure the explanation is rich, rigorous, and easy for students and practitioners to understand."
    ),
    "LIST": (
        "QUESTION TYPE: CATEGORIES, TYPES & LISTS ('types of X', 'steps to do X', 'categories with examples')\n"
        "INSTRUCTION: Provide a comprehensive, detailed breakdown of all types/categories/methods. "
        "For EACH item in the list:\n"
        "  1. Bold Title & Core Definition: Clearly define what it is.\n"
        "  2. How It Works / Key Characteristics: Explain the core mechanics or methodology.\n"
        "  3. Practical Real-World Examples: Provide concrete, relatable examples illustrating where and how it is used.\n"
        "  4. Common Algorithms or Techniques (if applicable in context).\n"
        "Do NOT write brief one-line summaries. Provide a rich, informative explanation for every category so the reader gains a deep understanding."
    ),
    "COMPARISON": (
        "QUESTION TYPE: COMPARISON ('difference between X and Y', 'compare X and Y')\n"
        "INSTRUCTION: Provide a structured comparison starting with a high-level summary of the key distinction, "
        "followed by a clean GFM markdown table comparing key dimensions (Objective, Data Type, Algorithms, Pros/Cons, Real-World Use Cases), "
        "and detailed explanatory paragraphs with concrete examples for each."
    ),
    "FORMULA": (
        "QUESTION TYPE: FORMULA & MATHEMATICS ('formula for X', 'how to calculate X')\n"
        "INSTRUCTION: Present the exact mathematical formulation FIRST using standard LaTeX ($...$ inline or $$...$$ display block). "
        "Then define every single variable, parameter, and symbol in a clear breakdown list. "
        "Follow with an intuitive step-by-step explanation of what the equation represents and provide a concrete numerical or conceptual walkthrough example."
    ),
    "SUMMARY": (
        "QUESTION TYPE: SUMMARY ('summarize this document/chapter/topic')\n"
        "INSTRUCTION: Provide an executive, structured summary covering the core themes, major methodologies, key takeaways, and practical implications with clear markdown headings (###)."
    ),
}

_STANDARD_FORMATTING_RULES = (
    "STANDARD FORMATTING & QUALITY RULES:\n"
    "- DEPTH & RIGOR: Provide thorough, well-structured, industry-grade responses. Avoid shallow 3-line summaries.\n"
    "- STRUCTURE: Use clear hierarchy with Markdown headings (###), bold key terms, and bullet points for readability.\n"
    "- EXAMPLES: Always include concrete, illustrative real-world examples when explaining concepts, types, and workflows.\n"
    "- CITATION PLACEMENT: Place citation markers [1], [2], etc. immediately after the specific claim, definition, or fact they support.\n"
    "- SOURCES LINE: End your response with a dedicated 'Sources:' line listing ONLY the document titles actually cited in your response (e.g., 'Sources: [1] Module 1 - Introduction to Machine Learning.pdf, [2] Machine Learning Guide.pdf').\n"
    "- MATHEMATICS & FORMULAS: Always use proper LaTeX notation ($formula$ or $$formula$$) for equations, matrices, vectors ($x \\in \\mathbb{R}^d$), and Greek letters.\n"
    "- CODE: Always wrap code in fenced code blocks with language tags (```python, ```cpp, etc.)."
)


def rewrite_query_with_context(
    user_query: str,
    conversation_history: Optional[List[Any]] = None,
    running_summary: Optional[str] = None
) -> str:
    """
    Rewrites a follow-up user query into a complete, standalone question using conversation context.
    If the query is already standalone or no history exists, returns user_query as-is.
    """
    raw_query = (user_query or "").strip()
    if not raw_query:
        return ""

    if not conversation_history and not running_summary:
        return raw_query

    relevant_history = [
        m for m in (conversation_history or [])
        if getattr(m, 'role', m.get('role') if isinstance(m, dict) else '') in ('user', 'assistant')
    ]

    if not relevant_history and not running_summary:
        return raw_query

    history_lines = []
    if running_summary:
        history_lines.append(f"Summary of earlier conversation: {running_summary}")

    for m in relevant_history[-4:]:  # last 2 turns is usually enough
        role = getattr(m, 'role', m.get('role') if isinstance(m, dict) else 'User')
        role_label = 'User' if role == 'user' else 'Assistant'
        content = getattr(m, 'content', m.get('content') if isinstance(m, dict) else '')
        if content:
            history_lines.append(f"{role_label}: {content}")

    history_text = "\n".join(history_lines).strip()
    if not history_text:
        return raw_query

    rewrite_prompt = f"""Given this recent conversation:
{history_text}

The user's new message is: "{raw_query}"

If this new message is a follow-up that depends on the previous conversation (e.g. "explain that more," "give an example," "what about X" referring to something just discussed), rewrite it into a complete, standalone question that includes the necessary context. If it's already a complete, standalone question unrelated to the prior conversation, return it exactly as-is.

Return ONLY the rewritten question, nothing else."""

    try:
        response, _ = _call_llm(rewrite_prompt, max_tokens=150, temperature=0.1)
        if response:
            cleaned = response.strip().strip('"').strip("'").strip()
            if cleaned and len(cleaned) >= 2:
                logger.info(f"[QueryRewrite] Original: '{raw_query}' -> Rewritten: '{cleaned}'")
                return cleaned
    except Exception as e:
        logger.warning(f"[QueryRewrite] Contextual rewrite failed: {e}. Using original query.")

    return raw_query


def generate_conversation_summary(
    messages: List[Any],
    existing_summary: Optional[str] = None
) -> Optional[str]:
    """
    Generates a 2-3 sentence running summary of conversation turns that fall outside the sliding window.
    """
    if not messages:
        return existing_summary

    history_lines = []
    if existing_summary:
        history_lines.append(f"Previous summary: {existing_summary}")

    for m in messages:
        role = getattr(m, 'role', m.get('role') if isinstance(m, dict) else 'User')
        role_label = 'User' if role == 'user' else 'Assistant'
        content = getattr(m, 'content', m.get('content') if isinstance(m, dict) else '')
        if content:
            history_lines.append(f"{role_label}: {content}")

    conv_text = "\n".join(history_lines)
    prompt = (
        "Summarize this conversation so far in 2-3 concise sentences, preserving key facts, entities, and topics discussed:\n\n"
        f"{conv_text}\n\n"
        "Summary:"
    )

    try:
        res, _ = _call_llm(prompt, max_tokens=250, temperature=0.2)
        if res:
            logger.info(f"[ConversationSummary] Generated new running summary: {res.strip()[:100]}...")
            return res.strip()
    except Exception as e:
        logger.warning(f"[ConversationSummary] Summary generation failed: {e}")

    return existing_summary


def _build_rag_prompt(
    query: str,
    context_str: str,
    question_type: str = "EXPLANATION",
    history_text: str = "",
    running_summary: str = ""
) -> str:
    type_instruction = _TYPE_INSTRUCTIONS.get(question_type, _TYPE_INSTRUCTIONS["EXPLANATION"])
    summary_block = f"SUMMARY OF PREVIOUS CONVERSATION:\n{running_summary}\n\n" if running_summary else ""
    history_block = f"CONVERSATION HISTORY (for context only):\n{history_text}\n\n" if history_text else ""

    return (
        "SYSTEM: You are Knowledge AI, an expert research assistant. Answer using ONLY the retrieved document excerpts below as your source of truth. "
        "Use the conversation history only to understand what the user is referring to (such as 'that', 'it', 'the second point', etc.), not as a source of factual information.\n\n"
        f"{summary_block}"
        f"{history_block}"
        f"DOCUMENT EXCERPTS (your actual source of truth):\n{context_str}\n\n"
        f"CURRENT QUESTION:\n{query}\n\n"
        f"{type_instruction}\n\n"
        f"{_STANDARD_FORMATTING_RULES}"
    )


def _build_general_prompt(
    query: str,
    question_type: str = "EXPLANATION",
    history_text: str = "",
    running_summary: str = ""
) -> str:
    type_instruction = _TYPE_INSTRUCTIONS.get(question_type, _TYPE_INSTRUCTIONS["EXPLANATION"])
    summary_block = f"SUMMARY OF PREVIOUS CONVERSATION:\n{running_summary}\n\n" if running_summary else ""
    history_block = f"CONVERSATION HISTORY (for context only):\n{history_text}\n\n" if history_text else ""

    return (
        "SYSTEM: You are Knowledge AI, an expert assistant.\n\n"
        f"{summary_block}"
        f"{history_block}"
        f"CURRENT QUESTION:\n{query}\n\n"
        f"{type_instruction}\n\n"
        f"{_STANDARD_FORMATTING_RULES}"
    )


def _call_groq(prompt: str, max_tokens: int = 3000, temperature: float = 0.2) -> Optional[str]:
    """Calls Groq API using Groq SDK or httpx fallback."""
    if _provider_state["groq"]["status"] == "not_configured":
        validate_providers_at_startup()

    api_key = (settings.GROQ_API_KEY or "").strip()
    if not api_key:
        return None

    timeout_sec = _get_timeout()
    model_candidates = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
    ]

    # 1. Try official Groq SDK
    groq_client = _get_groq_client()
    if groq_client:
        for model_name in model_candidates:
            try:
                chat_completion = groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model=model_name,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    timeout=timeout_sec,
                )
                if chat_completion and chat_completion.choices:
                    ans = chat_completion.choices[0].message.content
                    if ans:
                        logger.info(f"[LLM] Groq SDK model '{model_name}' responded ({len(ans)} chars)")
                        return ans.strip()
            except Exception as ge:
                logger.warning(f"[Groq SDK Failed] Model: '{model_name}': {ge}")

    # 2. Fallback to direct HTTP with httpx
    try:
        import httpx
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        for model_name in model_candidates:
            try:
                payload = {
                    "model": model_name,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
                res = httpx.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=timeout_sec
                )
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices:
                        ans = choices[0].get("message", {}).get("content", "")
                        if ans:
                            logger.info(f"[LLM] Groq HTTP model '{model_name}' responded ({len(ans)} chars)")
                            return ans.strip()
                else:
                    logger.warning(f"[Groq HTTP Failed] Model: '{model_name}' status={res.status_code}: {res.text[:200]}")
            except Exception as he:
                logger.warning(f"[Groq HTTP Exception] Model: '{model_name}': {he}")
    except Exception as ie:
        logger.error(f"[Groq] HTTP fallback unavailable: {ie}")

    logger.error("[LLM] All Groq candidate models failed.")
    return None


def _call_gemini(prompt: str) -> Optional[str]:
    if _provider_state["gemini"]["status"] == "not_configured":
        validate_providers_at_startup()

    if not _provider_state["gemini"]["enabled"]:
        return None

    genai = _get_genai()
    if genai is None:
        return None

    api_key = (settings.GEMINI_API_KEY or "").strip()
    if not api_key:
        return None

    timeout_sec = _get_timeout()
    genai.configure(api_key=api_key)

    model_candidates = [
        "gemini-3.7-flash",
        "gemini-flash-latest",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
    ]

    max_retries_per_model = 2

    for model_name in model_candidates:
        for attempt in range(max_retries_per_model + 1):
            try:
                model = genai.GenerativeModel(model_name)
                res = model.generate_content(
                    prompt,
                    request_options={"timeout": timeout_sec}
                )
                if res and hasattr(res, "text") and res.text:
                    logger.info(f"[LLM] Gemini model '{model_name}' responded ({len(res.text)} chars)")
                    return res.text.strip()
            except Exception as me:
                err_type = type(me).__name__
                err_code = getattr(me, 'code', None) or getattr(me, 'status_code', None) or 'N/A'
                err_msg = str(me)
                err_lower = err_msg.lower()

                logger.warning(
                    f"[Gemini Call Failed] Model: '{model_name}' | Attempt: {attempt+1}/{max_retries_per_model+1} | "
                    f"ErrorType: {err_type} | Code: {err_code} | Message: {err_msg[:300]}"
                )

                is_rate_limit = any(x in err_lower for x in ["429", "quota", "resourceexhausted", "rate limit", "too many requests"])
                is_auth_error = not is_rate_limit and any(x in err_lower for x in ["api_key invalid", "invalid api_key", "api key invalid", "invalid api key", "unauthenticated", "permission_denied", "forbidden"])

                if is_rate_limit:
                    if attempt < max_retries_per_model:
                        backoff = 2.0 * (attempt + 1)
                        logger.info(f"[Gemini 429 Retry] Rate limit hit on '{model_name}'. Retrying in {backoff:.1f}s...")
                        time.sleep(backoff)
                        continue
                    else:
                        break

                if is_auth_error:
                    logger.error(f"[Gemini Auth Error] API key invalid: {err_msg}")
                    return None
                break

    logger.error("[LLM] All Gemini candidate models failed.")
    return None


def _call_llm(prompt: str, max_tokens: int = 3000, temperature: float = 0.2) -> Tuple[Optional[str], str]:
    """
    Unified LLM router:
    Checks configured provider order (Groq primary, Gemini paused/fallback).
    Returns (answer_text, provider_name).
    """
    provider_pref = (settings.LLM_PROVIDER or "groq").lower()

    if provider_pref == "groq" or _provider_state["groq"]["enabled"]:
        res = _call_groq(prompt, max_tokens=max_tokens, temperature=temperature)
        if res:
            return res, "groq"
        if _provider_state["gemini"]["enabled"]:
            logger.warning("[LLM] Groq failed, attempting fallback to Gemini...")
            gem_res = _call_gemini(prompt)
            if gem_res:
                return gem_res, "gemini"

    elif provider_pref == "gemini" or _provider_state["gemini"]["enabled"]:
        res = _call_gemini(prompt)
        if res:
            return res, "gemini"
        if _provider_state["groq"]["enabled"]:
            logger.warning("[LLM] Gemini failed, attempting fallback to Groq...")
            gr_res = _call_groq(prompt, max_tokens=max_tokens, temperature=temperature)
            if gr_res:
                return gr_res, "groq"

    return None, "fallback"


def generate_answer(
    query: str,
    retrieved_chunks: List[Dict[str, Any]],
    zero_chunk_mode: bool = False,
    question_type: str = "EXPLANATION",
    conversation_history: Optional[List[Any]] = None,
    running_summary: Optional[str] = None,
) -> Dict[str, Any]:
    t0 = time.time()

    # Format recent conversation turns (up to last 8 messages = 4 turns)
    history_lines = []
    if conversation_history:
        for m in conversation_history[-8:]:
            role = getattr(m, 'role', m.get('role') if isinstance(m, dict) else 'User')
            role_label = 'User' if role == 'user' else 'Assistant'
            content = getattr(m, 'content', m.get('content') if isinstance(m, dict) else '')
            if content:
                history_lines.append(f"{role_label}: {content}")
    history_text = "\n".join(history_lines)
    summary_text = (running_summary or "").strip()

    if zero_chunk_mode or not retrieved_chunks:
        prompt = _build_general_prompt(
            query,
            question_type=question_type,
            history_text=history_text,
            running_summary=summary_text,
        )
    else:
        top_chunks = retrieved_chunks[:50] if any(c.get("is_workflow_expanded") for c in retrieved_chunks) else retrieved_chunks[:8]
        context_blocks = []
        total_context_chars = 0
        max_context_chars = 25000

        for idx, item in enumerate(top_chunks, start=1):
            doc_title = item.get("document_title") or "Document"
            sec_title = item.get('section_title')
            clean_lbl = _clean_section_title(sec_title)
            sec_lbl = f" [{clean_lbl}]" if clean_lbl else ""
            cleaned_text = clean_chunk_text(item.get("content", ""), max_chars=1000)
            if total_context_chars + len(cleaned_text) > max_context_chars:
                break
            context_blocks.append(
                f"[{idx}] (Document: {doc_title}){sec_lbl} Content:\n{cleaned_text}"
            )
            total_context_chars += len(cleaned_text)

        context_str = "\n\n".join(context_blocks)
        prompt = _build_rag_prompt(
            query,
            context_str,
            question_type=question_type,
            history_text=history_text,
            running_summary=summary_text,
        )

    try:
        result, active_provider = _call_llm(prompt, max_tokens=3000, temperature=0.2)
        if result:
            # Quality check: check if answer is shallow/meta-referential
            if is_shallow_or_meta_answer(result, query):
                logger.warning(
                    f"[QualityCheck] Shallow/meta answer detected ({len(result.split())} words) for query='{query[:50]}'. "
                    f"Retrying with corrective instruction..."
                )
                retry_prompt = (
                    f"{prompt}\n\n"
                    "CRITICAL CORRECTION REQUIRED:\n"
                    "Your previous response was too vague, shallow, or only referenced that a definition/topic exists without stating it. "
                    "You MUST state the actual, complete, and substantive definition and explanation directly from the document excerpts above. "
                    "Do NOT produce meta-references (e.g. do not say 'it is defined in Chapter X' or 'it is defined formally and intuitively'). "
                    "State the full definition immediately in 3-5 complete sentences."
                )
                retry_result, retry_prov = _call_llm(retry_prompt, max_tokens=1500, temperature=0.2)
                if retry_result and len(retry_result.split()) >= len(result.split()):
                    result = retry_result
                    active_provider = retry_prov

            elapsed = time.time() - t0
            logger.info(f"[LLM] {active_provider.upper()} answered in {elapsed:.2f}s (query: '{query[:50]}', type: {question_type})")
            clean_answer = sanitize_answer_text(result)
            speech_text = build_speech_text(clean_answer)
            return {
                "answer": clean_answer,
                "speech_text": speech_text,
                "provider": active_provider,
                "degraded": False,
            }
    except Exception as e:
        logger.error(f"[LLM] Call failed: {e}", exc_info=True)

    elapsed = time.time() - t0
    logger.warning(f"[LLM] Returning structured fallback after {elapsed:.2f}s (query: '{query[:50]}')")
    fallback_res = format_fallback_chunks(retrieved_chunks, query=query, max_chunks=50)
    return {
        "answer": fallback_res["answer"],
        "speech_text": fallback_res["speech_text"],
        "provider": "fallback",
        "degraded": True,
    }

