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
from typing import List, Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger("knowledge_ai.llm_provider")

# ──────────────────────────────────────────────────────────────
# Provider state — populated once at startup via validate_providers_at_startup()
# ──────────────────────────────────────────────────────────────
_provider_state: Dict[str, Dict[str, Any]] = {
    "gemini": {"enabled": False, "status": "not_configured", "reason": ""},
}

# Lazy-loaded Gemini SDK
_genai = None


def _get_genai():
    """Lazy-import google.generativeai to avoid import-time crashes."""
    global _genai
    if _genai is None:
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", category=FutureWarning)
                import google.generativeai as genai
            _genai = genai
        except ImportError:
            _genai = False          # SDK not installed
        except Exception:
            _genai = False
    return _genai if _genai is not False else None


# ──────────────────────────────────────────────────────────────
# Startup validation
# ──────────────────────────────────────────────────────────────
def _validate_gemini_key(key: str) -> tuple:
    """
    Returns (is_valid, reason).

    Google Gemini API keys come in two formats:
      - Legacy: starts with "AIzaSy" (~39 chars)
      - New (2025+): starts with "AQ." (variable length, often longer)
    Both are valid — Google is gradually migrating to the new format.
    """
    if not key:
        return False, "GEMINI_API_KEY is empty or missing"
    key = key.strip()
    is_legacy = key.startswith("AIzaSy")
    is_new_format = key.startswith("AQ.")
    if not is_legacy and not is_new_format:
        return False, (
            f"GEMINI_API_KEY doesn't match known formats — "
            f"expected 'AIzaSy...' (legacy) or 'AQ...' (new). "
            f"Got '{key[:10]}...'"
        )
    if is_legacy and (len(key) < 30 or len(key) > 60):
        return False, f"GEMINI_API_KEY (legacy format) length looks wrong ({len(key)} chars)"
    if is_new_format and len(key) < 10:
        return False, f"GEMINI_API_KEY (new format) looks too short ({len(key)} chars)"
    return True, f"ok ({('new AQ.' if is_new_format else 'legacy AIzaSy')} format)"


def validate_providers_at_startup() -> None:
    """
    Called once during FastAPI lifespan startup.
    Validates the Gemini API key and logs a clear banner.
    Does NOT crash the app — just disables Gemini if the key is bad.
    """
    global _provider_state

    gemini_key = (settings.GEMINI_API_KEY or "").strip()
    valid, reason = _validate_gemini_key(gemini_key)
    if valid:
        genai = _get_genai()
        if genai is not None:
            _provider_state["gemini"] = {"enabled": True, "status": "healthy", "reason": reason}
        else:
            _provider_state["gemini"] = {"enabled": False, "status": "sdk_missing",
                                          "reason": "google-generativeai package not installed"}
    else:
        _provider_state["gemini"] = {"enabled": False, "status": "key_invalid", "reason": reason}

    # ── Startup banner ────────────────────────────────────
    p = _provider_state["gemini"]
    icon = "✅" if p["enabled"] else "❌"
    detail = p["reason"] if p["reason"] else p["status"]

    banner_lines = [
        "",
        "╔══════════════════════════════════════════════════════════════╗",
        "║               LLM PROVIDER STATUS AT STARTUP               ║",
        "╠══════════════════════════════════════════════════════════════╣",
        f"║  {icon}  GEMINI    {detail:44s}  ║",
        "╠══════════════════════════════════════════════════════════════╣",
    ]

    if p["enabled"]:
        banner_lines.append("║  Active: gemini → fallback (raw chunks)                     ║")
    else:
        banner_lines.append("║  ⚠  GEMINI UNAVAILABLE — raw chunk fallback only            ║")
    banner_lines.append("╚══════════════════════════════════════════════════════════════╝")
    banner_lines.append("")

    banner = "\n".join(banner_lines)
    logger.info(banner)
    print(banner)

    if not p["enabled"]:
        logger.warning(
            "GEMINI_API_KEY missing or invalid — check backend/.env, "
            "get a key at https://aistudio.google.com/apikey"
        )


def get_provider_status() -> Dict[str, Any]:
    """Returns current provider health for the /api/v1/health/llm-status endpoint."""
    p = _provider_state["gemini"]
    return {
        "providers": {
            "gemini": {"enabled": p["enabled"], "status": p["status"]},
        },
        "active_provider": "gemini" if p["enabled"] else "fallback",
        "fallback_chain": (["gemini", "fallback"] if p["enabled"] else ["fallback"]),
    }


# ──────────────────────────────────────────────────────────────
# Chunk Cleaning & Formatting Helpers
# ──────────────────────────────────────────────────────────────
# Boilerplate line patterns: lines matching these are skipped during chunk cleaning
_BOILERPLATE_LINE_PATTERNS = [
    re.compile(r'GoalKicker\.com', re.IGNORECASE),
    re.compile(r'^www\.\S+\.com', re.IGNORECASE),
    re.compile(r'Notes for Professionals', re.IGNORECASE),
    re.compile(r'^Chapter\s+\d+\b', re.IGNORECASE),
    re.compile(r'^Page\s+\d+\s*$', re.IGNORECASE),
    re.compile(r'^\s*\d+\s*$'),                    # lone page numbers
    re.compile(r'^\d+\s+[A-Z ]{6,}$'),             # e.g. "216 PYTHON NOTES"
]


def _is_boilerplate_line(line: str) -> bool:
    """Returns True if a line is pure boilerplate and should be skipped."""
    stripped = line.strip()
    if not stripped:
        return False
    return any(pat.search(stripped) for pat in _BOILERPLATE_LINE_PATTERNS)


def clean_chunk_text(text: str, max_chars: int = 500) -> str:
    """
    Strips PDF extraction artifacts and boilerplate lines, then trims
    to the last complete sentence boundary within max_chars.
    """
    if not text:
        return ""

    # 1. Remove <<end>>, <<start>>, and similar markers
    s = re.sub(r'<<[^>]+>>', '', text)

    # 2. Fix mid-word hyphenated line breaks: "word-\nbreak" -> "wordbreak"
    s = re.sub(r'(\w+)-\s*\n\s*([a-z]\w*)', r'\1\2', s)

    # 3. Filter lines — skip boilerplate-only lines (headers, site names, lone numbers)
    lines = s.splitlines()
    clean_lines = [ln for ln in lines if not _is_boilerplate_line(ln)]
    s = ' '.join(clean_lines)

    # 4. Remove control characters and stray non-printable symbols
    s = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\uf000-\uffff]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()

    if not s:
        return ''

    if len(s) <= max_chars:
        return s

    # 5. Trim at the last complete sentence boundary
    candidate = s[:max_chars]
    last_punct = max(candidate.rfind('. '), candidate.rfind('! '), candidate.rfind('? '))

    if last_punct > 80:
        return candidate[:last_punct + 1].strip()

    # Fallback: trim at last word boundary
    last_space = candidate.rfind(' ')
    if last_space > 50:
        return candidate[:last_space].strip() + '...'

    return candidate + '...'


# Code-detection heuristics: a chunk is treated as "code" if it has enough code indicators
_CODE_INDICATORS = [
    r'def \w+\(',       # Python function defs
    r'class \w+[:(]',  # Class definitions
    r'import \w+',     # Import statements
    r'[a-z_]+ ?= ?[a-z_\[{(\'"\d]',  # variable assignments
    r'\bif\b.+:$',     # if statements
    r'\bfor\b.+:$',    # for loops
    r'=>|->|::|\|\|',  # arrows, scope operators
    r';\s*$',          # line ending semicolons (JS/C style)
]
_CODE_PATTERNS = [re.compile(p) for p in _CODE_INDICATORS]


def _looks_like_code(text: str) -> bool:
    """Heuristic: returns True if text looks like source code."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if not lines:
        return False
    hits = sum(
        1 for line in lines
        if any(pat.search(line) for pat in _CODE_PATTERNS)
    )
    return hits >= max(2, len(lines) // 3)  # 33%+ lines look like code


def _detect_language(text: str) -> str:
    """Best-guess language tag for a code block."""
    if re.search(r'\bdef \w+|\bimport \w+|\bprint\(', text):
        return 'python'
    if re.search(r'function \w+|const |let |var |=>|console\.', text):
        return 'javascript'
    if re.search(r'#include|std::|cout|cin', text):
        return 'cpp'
    return 'text'


def format_fallback_chunks(chunks: List[Dict[str, Any]], max_chunks: int = 3) -> Dict[str, str]:
    """
    Format retrieved chunks into a professionally structured markdown answer.
    - Code chunks are wrapped in fenced code blocks with language detection.
    - Prose chunks are shown as clean paragraphs.
    - No filenames, page numbers, or PDF boilerplate are shown.
    """
    if not chunks:
        return {
            "answer": "I couldn't find relevant information in your documents for this question. Please try rephrasing or upload more relevant documents.",
            "speech_text": "I couldn't find relevant information in your documents for this question.",
        }

    sections: List[str] = []
    for c in chunks[:max_chunks]:
        raw = c.get("content", "")
        if not raw:
            continue

        # Strip markers and boilerplate BEFORE code detection (preserve line structure)
        pre = re.sub(r'<<[^>]+>>', '', raw)
        pre_lines = [ln for ln in pre.splitlines() if not _is_boilerplate_line(ln)]
        pre_clean = '\n'.join(pre_lines).strip()

        is_code = _looks_like_code(pre_clean)
        lang = _detect_language(pre_clean) if is_code else ''

        if is_code:
            # Preserve code line formatting for clean syntax highlighted blocks
            sections.append(f"```{lang}\n{pre_clean}\n```")
        else:
            content = clean_chunk_text(raw, max_chars=600)
            if not content:
                continue
            sections.append(content.strip())

    if not sections:
        return {
            "answer": "I couldn't find relevant information in your documents for this question.",
            "speech_text": "I couldn't find relevant information in your documents for this question.",
        }

    joined = "\n\n---\n\n".join(sections)

    display_answer = (
        "> **Note:** The AI model is currently unavailable. "
        "Showing the most relevant excerpts from your documents directly.\n\n"
        + joined
    )

    speech_text = (
        "The AI model is currently unavailable, but I found relevant information in your documents. "
        "You can read the excerpts on screen."
    )

    return {
        "answer": display_answer,
        "speech_text": speech_text,
    }



# ──────────────────────────────────────────────────────────────
# Gemini Provider Call with Retries & Detailed Error Logging
# ──────────────────────────────────────────────────────────────
_TIMEOUT = None


def _get_timeout() -> float:
    global _TIMEOUT
    if _TIMEOUT is None:
        _TIMEOUT = float(settings.LLM_TIMEOUT_SECONDS or 10)
    return _TIMEOUT


def _build_rag_prompt(query: str, context_str: str) -> str:
    return (
        "You are Knowledge AI, an expert research assistant. "
        "Answer the user's question using ONLY the provided document excerpts as your source of truth. "
        "Do NOT copy raw text, titles, copyright notices, or front-matter verbatim — synthesize the answer in your own words. "
        "If the excerpts do not contain enough information, respond with exactly: "
        "'I couldn't find information about this in your uploaded documents.'\n\n"
        "FORMATTING RULES (follow strictly):\n"
        "- Use clear markdown: headings (##), bullet points (-), bold (**text**), numbered lists.\n"
        "- For any code examples, ALWAYS wrap them in fenced code blocks with the correct language (```python, ```javascript, etc.).\n"
        "- Keep the answer focused. Use short paragraphs. Avoid walls of plain text.\n"
        "- Cite sources using [1][2] style markers matching the excerpt numbers.\n\n"
        f"DOCUMENT EXCERPTS:\n{context_str}\n\n"
        f"USER QUESTION:\n{query}"
    )


def _build_general_prompt(query: str) -> str:
    return (
        "You are Knowledge AI, an expert assistant. "
        f"Answer this question clearly and accurately: {query}\n\n"
        "FORMATTING RULES (follow strictly):\n"
        "- Use clear markdown: headings (##), bullet points (-), bold (**text**), numbered lists where appropriate.\n"
        "- For any code examples, ALWAYS use fenced code blocks with the correct language tag (```python, ```javascript, etc.).\n"
        "- Keep answers well-structured and easy to read. Avoid walls of plain text.\n"
        "- Include key concepts, definitions, and practical examples.\n"
        "- Do NOT mention that no documents were found."
    )


def _call_gemini(prompt: str) -> Optional[str]:
    """
    Try Gemini with retry & exponential backoff on transient 429 rate-limit errors.
    Logs detailed error info (HTTP status, error type, response body if present).
    """
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

    # Preferred models order
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

                # Detailed failure logging with HTTP status / exception details
                logger.warning(
                    f"[Gemini Call Failed] Model: '{model_name}' | Attempt: {attempt+1}/{max_retries_per_model+1} | "
                    f"ErrorType: {err_type} | Code: {err_code} | Message: {err_msg[:300]}"
                )

                # Check if rate-limited (429 / quota)
                is_rate_limit = any(x in err_lower for x in ["429", "quota", "resourceexhausted", "rate limit", "too many requests"])
                is_auth_error = any(x in err_lower for x in ["api_key", "invalid", "403", "401", "unauthenticated", "permission"])

                if is_auth_error:
                    logger.error(f"[Gemini Auth Error] API key invalid or unauthenticated: {err_msg}")
                    return None  # Stop immediately on auth error

                if is_rate_limit:
                    if attempt < max_retries_per_model:
                        backoff = 1.5 * (attempt + 1)
                        logger.info(f"[Gemini 429 Retry] Rate limit hit on '{model_name}'. Retrying in {backoff:.1f}s...")
                        time.sleep(backoff)
                        continue
                    else:
                        logger.warning(f"[Gemini 429 Exceeded] Retries exhausted for model '{model_name}'. Trying next model candidate...")
                        break  # Move to next model candidate

                # Non-rate-limit error: move to next model immediately
                break

    logger.error("[LLM] All Gemini candidate models and retries failed.")
    return None


# ──────────────────────────────────────────────────────────────
# Main public API
# ──────────────────────────────────────────────────────────────
def generate_answer(
    query: str,
    retrieved_chunks: List[Dict[str, Any]],
    zero_chunk_mode: bool = False,
) -> Dict[str, Any]:
    """
    Generate an LLM answer. Tries Gemini first, falls back to raw chunks.

    Parameters
    ----------
    query : str
        The user's question.
    retrieved_chunks : list
        Chunks from Qdrant/SQL retrieval (may be empty).
    zero_chunk_mode : bool
        If True, no chunks were found — use general-knowledge prompt.

    Returns
    -------
    dict with keys:
        answer      : str   — the generated text for display
        speech_text : str   — clean TTS text for voice synthesis
        provider    : str   — "gemini" | "fallback"
        degraded    : bool  — True only when using raw-chunk fallback
    """
    t0 = time.time()

    # ── Build prompt with Bounded Context (top 5 chunks, max ~12,000 chars total) ──
    if zero_chunk_mode or not retrieved_chunks:
        prompt = _build_general_prompt(query)
    else:
        # Cap to top 5 chunks max to protect token budget
        top_chunks = retrieved_chunks[:5]
        context_blocks = []
        total_context_chars = 0
        max_context_chars = 12000  # Safe ~3000 token limit

        for idx, item in enumerate(top_chunks, start=1):
            cleaned_text = clean_chunk_text(item.get("content", ""), max_chars=800)
            if total_context_chars + len(cleaned_text) > max_context_chars:
                break
            context_blocks.append(
                f"[{idx}] Source Document: {item.get('document_title', 'Document')} "
                f"(Page {item.get('page', 1)})\n"
                f"Content: {cleaned_text}"
            )
            total_context_chars += len(cleaned_text)

        context_str = "\n\n".join(context_blocks)
        prompt = _build_rag_prompt(query, context_str)

    # ── Try Gemini ────────────────────────────────────────
    try:
        result = _call_gemini(prompt)
        if result:
            elapsed = time.time() - t0
            logger.info(
                f"[LLM] Gemini answered in {elapsed:.2f}s "
                f"(query: '{query[:50]}')"
            )
            # Clean up common LLM output artifacts
            answer = re.sub(r'\n\s*\.\s*\n', '\n', result)
            answer = re.sub(r'\s+\.', '.', answer)
            answer = re.sub(r'(\.){2,}', '.', answer).strip()

            # Clean speech text for TTS (remove [1][2] citation markers)
            speech_text = re.sub(r'\[\d+\]', '', answer).strip()

            return {
                "answer": answer,
                "speech_text": speech_text,
                "provider": "gemini",
                "degraded": False,
            }
    except Exception as e:
        logger.error(f"[LLM] Unexpected error calling Gemini: {e}", exc_info=True)

    # ── Fallback: Clean Raw Chunks ───────────────────────
    elapsed = time.time() - t0
    logger.warning(
        f"[LLM] Gemini unavailable/failed after {elapsed:.2f}s — "
        f"returning clean raw chunk fallback (query: '{query[:50]}')"
    )

    fallback_res = format_fallback_chunks(retrieved_chunks, max_chunks=3)
    return {
        "answer": fallback_res["answer"],
        "speech_text": fallback_res["speech_text"],
        "provider": "fallback",
        "degraded": True,
    }
