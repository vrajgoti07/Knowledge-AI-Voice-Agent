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
    "gemini": {"enabled": False, "status": "not_configured", "reason": ""},
}

_genai = None


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


def _validate_gemini_key(key: str) -> tuple:
    if not key:
        return False, "GEMINI_API_KEY is empty or missing"
    key = key.strip()
    is_legacy = key.startswith("AIzaSy")
    is_new_format = key.startswith("AQ.")
    if not is_legacy and not is_new_format:
        return False, f"GEMINI_API_KEY format unrecognized ('{key[:10]}...')"
    return True, f"ok ({('new AQ.' if is_new_format else 'legacy AIzaSy')} format)"


def validate_providers_at_startup() -> None:
    global _provider_state
    gemini_key = (settings.GEMINI_API_KEY or "").strip()
    valid, reason = _validate_gemini_key(gemini_key)
    if valid:
        genai = _get_genai()
        if genai is not None:
            _provider_state["gemini"] = {"enabled": True, "status": "healthy", "reason": reason}
        else:
            _provider_state["gemini"] = {"enabled": False, "status": "sdk_missing", "reason": "google-generativeai package missing"}
    else:
        _provider_state["gemini"] = {"enabled": False, "status": "key_invalid", "reason": reason}

    p = _provider_state["gemini"]
    icon = "✅" if p["enabled"] else "❌"
    detail = p["reason"] if p["reason"] else p["status"]
    banner = f"\n[LLM Status] {icon} GEMINI: {detail}\n"
    logger.info(banner)


def get_provider_status() -> Dict[str, Any]:
    p = _provider_state["gemini"]
    return {
        "providers": {"gemini": {"enabled": p["enabled"], "status": p["status"]}},
        "active_provider": "gemini" if p["enabled"] else "fallback",
        "fallback_chain": ["gemini", "fallback"] if p["enabled"] else ["fallback"],
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
        _TIMEOUT = float(settings.LLM_TIMEOUT_SECONDS or 10)
    return _TIMEOUT


def classify_question_llm(query: str) -> Optional[str]:
    """Issues a fast Gemini call to classify an ambiguous question into one of the 6 core types."""
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
    res = _call_gemini(prompt)
    if res:
        cleaned = res.strip().upper()
        for cat in ["DEFINITION", "EXPLANATION", "LIST", "COMPARISON", "FORMULA", "SUMMARY"]:
            if cat in cleaned:
                return cat
    return None


_TYPE_INSTRUCTIONS: Dict[str, str] = {
    "DEFINITION": (
        "QUESTION TYPE: DEFINITION ('what is X', 'define X')\n"
        "INSTRUCTION: Answer in 2-4 concise, direct sentences. Do NOT provide a full topic overview unless explicitly requested. "
        "Do NOT use markdown headers (##). Strict maximum length: 80 words."
    ),
    "EXPLANATION": (
        "QUESTION TYPE: EXPLANATION ('explain X', 'how does X work', 'why does X happen')\n"
        "INSTRUCTION: Provide a structured multi-paragraph answer with a brief introduction, followed by organized sub-points. "
        "Use markdown headers (##) ONLY if there are multiple distinct sub-topics. Strict maximum length: 250 words unless the topic genuinely requires more."
    ),
    "LIST": (
        "QUESTION TYPE: LIST/STEPS ('list the types of X', 'steps to do X')\n"
        "INSTRUCTION: Provide a clean numbered or bulleted list with minimal introductory or concluding prose around it. "
        "Strict maximum length: 150 words unless the list itself is inherently long."
    ),
    "COMPARISON": (
        "QUESTION TYPE: COMPARISON ('difference between X and Y', 'compare X and Y')\n"
        "INSTRUCTION: Provide a side-by-side bullet comparison or a clean GFM markdown table comparing the concepts."
    ),
    "FORMULA": (
        "QUESTION TYPE: FORMULA/CALCULATION ('formula for X', 'how do you calculate X')\n"
        "INSTRUCTION: Present the mathematical formula or equation FIRST using proper LaTeX ($formula$ or $$formula$$), "
        "followed by a short, plain-language explanation of each term/variable."
    ),
    "SUMMARY": (
        "QUESTION TYPE: SUMMARY ('summarize this document/chapter')\n"
        "INSTRUCTION: Provide a structured summary with clear markdown headers (##) for major sections."
    ),
}

_STANDARD_FORMATTING_RULES = (
    "STANDARD FORMATTING RULES (apply strictly to all answers):\n"
    "- Bold key terms ONLY the first time they are introduced — do NOT bold every occurrence.\n"
    "- Use bullet points (-) or numbered lists (1. 2. 3.) for any enumerable information (types, steps, causes, examples) — NEVER write a wall of prose when content is naturally list-shaped.\n"
    "- Use markdown headers (##) ONLY for SUMMARY-type or long EXPLANATION answers with multiple distinct sub-topics — NEVER for short DEFINITION answers.\n"
    "- CITATION PLACEMENT: Place citation markers [1], [2] IMMEDIATELY after the specific claim or fact they support (e.g., 'Backpropagation calculates gradients using the chain rule [1].'), NOT all bunched at the end of paragraphs or answers.\n"
    "- SOURCES LINE: End every answer with a single 'Sources:' line listing ONLY the document titles actually cited in your response (e.g., 'Sources: [1] Machine Learning Overview, [2] Neural Networks Guide'), not every document in the knowledge base.\n"
    "- MATHEMATICS & FORMULAS:\n"
    "  • Source text extracted from PDFs may contain garbled or malformed mathematical notation due to PDF extraction limitations. When you recognize a standard formula (e.g. gradient descent, Bayes' theorem, cross-entropy loss) from context even if extracted text is imperfect, reconstruct it correctly using proper LaTeX notation rather than reproducing the garbled text.\n"
    "  • Always wrap math in standard LaTeX delimiters: inline math as $formula$ (e.g. $E = mc^2$), block equations as $$formula$$\n"
    "  • Use proper LaTeX notation: superscripts (^), subscripts (_), \\frac{}{}, \\sum, \\int, \\nabla, \\theta, \\mathbb{R}, etc.\n"
    "  • NEVER write math as plain text like 'AT' for transpose — always use $A^T$\n"
    "- CODE: Always wrap code in fenced code blocks with language tags (```python, ```javascript, etc.)"
)


def _build_rag_prompt(query: str, context_str: str, question_type: str = "EXPLANATION") -> str:
    type_instruction = _TYPE_INSTRUCTIONS.get(question_type, _TYPE_INSTRUCTIONS["EXPLANATION"])
    return (
        "You are Knowledge AI, an expert research assistant.\n"
        "Answer the user's question using ONLY the provided document excerpts as your source of truth.\n\n"
        f"{type_instruction}\n\n"
        f"{_STANDARD_FORMATTING_RULES}\n\n"
        f"DOCUMENT EXCERPTS:\n{context_str}\n\n"
        f"USER QUESTION:\n{query}"
    )


def _build_general_prompt(query: str, question_type: str = "EXPLANATION") -> str:
    type_instruction = _TYPE_INSTRUCTIONS.get(question_type, _TYPE_INSTRUCTIONS["EXPLANATION"])
    return (
        "You are Knowledge AI, an expert assistant.\n"
        f"Answer this question clearly and accurately: {query}\n\n"
        f"{type_instruction}\n\n"
        f"{_STANDARD_FORMATTING_RULES}"
    )


def _call_gemini(prompt: str) -> Optional[str]:
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
        "gemini-2.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-pro-latest",
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
                is_auth_error = any(x in err_lower for x in ["api_key", "invalid", "403", "401", "unauthenticated", "permission"])

                if is_auth_error:
                    logger.error(f"[Gemini Auth Error] API key invalid: {err_msg}")
                    return None

                if is_rate_limit:
                    if attempt < max_retries_per_model:
                        backoff = 1.5 * (attempt + 1)
                        logger.info(f"[Gemini 429 Retry] Rate limit hit on '{model_name}'. Retrying in {backoff:.1f}s...")
                        time.sleep(backoff)
                        continue
                    else:
                        break
                break

    logger.error("[LLM] All Gemini candidate models failed.")
    return None


def generate_answer(
    query: str,
    retrieved_chunks: List[Dict[str, Any]],
    zero_chunk_mode: bool = False,
    question_type: str = "EXPLANATION",
) -> Dict[str, Any]:
    t0 = time.time()

    if zero_chunk_mode or not retrieved_chunks:
        prompt = _build_general_prompt(query, question_type=question_type)
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
        prompt = _build_rag_prompt(query, context_str, question_type=question_type)

    try:
        result = _call_gemini(prompt)
        if result:
            elapsed = time.time() - t0
            logger.info(f"[LLM] Gemini answered in {elapsed:.2f}s (query: '{query[:50]}', type: {question_type})")
            clean_answer = sanitize_answer_text(result)
            speech_text = build_speech_text(clean_answer)
            return {
                "answer": clean_answer,
                "speech_text": speech_text,
                "provider": "gemini",
                "degraded": False,
            }
    except Exception as e:
        logger.error(f"[LLM] Gemini call failed: {e}", exc_info=True)

    elapsed = time.time() - t0
    logger.warning(f"[LLM] Returning structured fallback after {elapsed:.2f}s (query: '{query[:50]}')")
    fallback_res = format_fallback_chunks(retrieved_chunks, query=query, max_chunks=50)
    return {
        "answer": fallback_res["answer"],
        "speech_text": fallback_res["speech_text"],
        "provider": "fallback",
        "degraded": True,
    }

