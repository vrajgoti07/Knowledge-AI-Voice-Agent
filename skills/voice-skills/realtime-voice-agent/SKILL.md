---
name: realtime-voice-agent
description: Use this skill when building or modifying real-time, browser-based voice assistant interfaces (speech-to-text input, TTS output, barge-in interrupt, connection-state UI) for a RAG or chat product. Covers Web Speech API integration, voice state machines, and the accessibility/privacy/browser-support restrictions that apply to any client-side voice feature.
---

# Realtime Voice Agent (Web Speech API)

## When to use
Any task touching a voice/mic UI: a listening orb, a transcript panel, mic
permission handling, barge-in interrupt, or TTS playback control.

## Architecture (current implementation)
- STT and TTS run **entirely client-side** via `window.SpeechRecognition` /
  `window.speechSynthesis` — there is no backend audio pipeline. The backend
  `voice_service.py` module is a placeholder only; do not route audio through it
  unless the task explicitly asks to move STT/TTS server-side.
- Voice state machine (`VoiceStatus`): `Idle → Connecting → Listening → Thinking
  → Speaking`, plus `Error`. Every voice component must render all five states
  distinctly — do not collapse Thinking/Speaking or skip Connecting.
- Barge-in: speaking state must support immediate TTS cancellation
  (`speechSynthesis.cancel()`) the instant the user starts talking again.

## Color & motion rules
- Use `--color-voice-active` / `--color-voice-glow` (see index.css @theme) for the
  Listening/Speaking indicator. Idle uses neutral border tokens. Error uses
  `--color-danger`. Never introduce a new palette per-component.
- Every animated element (orb pulse, equalizer bars, scanline) must have a static
  fallback behind `window.matchMedia('(prefers-reduced-motion: reduce)')`.

## Required restrictions (do not skip these)
1. **Secure context only** — `getUserMedia`/`SpeechRecognition` require HTTPS (or
   localhost). Surface a clear error state, not a silent failure, on HTTP/unsupported
   browsers (Web Speech API has patchy support outside Chromium).
2. **Explicit mic permission UX** — never auto-request mic access on page load;
   require a user gesture (tap the orb/mic button) before calling
   `SpeechRecognition.start()`.
3. **No silent recording** — the UI must always show a visible "Listening" state
   while the mic is active; never capture audio without an on-screen indicator.
4. **No persistence of raw audio or transcripts without consent** — if transcripts
   are saved to conversation history, that must be the same consent/storage policy
   as text chat, not a separate silent behavior.
5. **Graceful degradation** — if `SpeechRecognition`/`speechSynthesis` is undefined,
   show a "voice not supported in this browser" state and fall back to text input;
   never crash the page.
6. **Interrupt safety** — end-session / mute controls must remain reachable and
   responsive even mid-TTS-playback (fixed position, never blocked by animation).

## Checklist before shipping a voice UI change
- [ ] All five VoiceStatus states visually distinct
- [ ] Reduced-motion fallback present
- [ ] Colors resolve to theme tokens, not raw Tailwind palette classes
- [ ] Mic permission requested only on user gesture
- [ ] Unsupported-browser fallback tested
- [ ] Barge-in cancels TTS immediately
