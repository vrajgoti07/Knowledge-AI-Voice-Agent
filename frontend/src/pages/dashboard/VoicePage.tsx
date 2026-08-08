// ============================================================
// VoicePage — Premium Next-Gen Real-Time Voice Interface
// Dynamic Orb with prefers-reduced-motion fallback
// Persistent fixed-height live-transcript panel
// Fixed controls (mute/interrupt/end session)
// Distinct connection states: Connecting / Listening / Speaking / Error / Idle
// Real TTS cancellation (barge-in interrupt)
// ============================================================

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Mic, MicOff, PhoneOff, AlertCircle, Loader2, AudioLines, VolumeX
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { apiPost } from '@/services/api'
import { toast } from '@/store/uiStore'

export interface CitationItem {
  id?: string
  documentId?: string
  documentTitle?: string
  excerpt: string
  page?: number
}

export interface TranscriptLine {
  id: string
  speaker: 'You' | 'Knowledge AI'
  text: string
  timestamp: string
  citations?: CitationItem[]
}

type VoiceStatus = 'Idle' | 'Connecting' | 'Listening' | 'Thinking' | 'Speaking' | 'Error'

// ── Dynamic Voice Orb ─────────────────────────────────────────
function VoiceOrb({ status }: { status: VoiceStatus }) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isActive = status !== 'Idle' && status !== 'Error'
  const isListening = status === 'Listening'
  const isSpeaking = status === 'Speaking'
  const isConnecting = status === 'Connecting'

  if (prefersReduced) {
    return (
      <div className="relative flex items-center justify-center w-48 h-48">
        <div className={`w-36 h-36 rounded-full flex items-center justify-center border-4 ${
          isListening ? 'border-cyan-400 bg-cyan-950/60' : isSpeaking ? 'border-indigo-500 bg-indigo-950/60' : 'border-slate-700 bg-slate-900'
        }`}>
          <AudioLines className={`w-12 h-12 ${isListening ? 'text-cyan-400' : isSpeaking ? 'text-indigo-400' : 'text-slate-500'}`} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      {isActive && (
        <>
          {[0, 0.4, 0.8].map((delay) => (
            <motion.div
              key={delay}
              className="absolute rounded-full"
              style={{
                width: '100%',
                height: '100%',
                border: isListening
                  ? '1.5px solid rgba(34,211,238,0.35)'
                  : '1.5px solid rgba(99,102,241,0.3)',
              }}
              animate={{ scale: [1, 1.8, 2.4], opacity: [0.6, 0.3, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}

      <motion.div
        className="absolute rounded-full"
        style={{
          width: '84%',
          height: '84%',
          background: isListening
            ? 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)'
            : isSpeaking
            ? 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(30,58,138,0.3) 0%, transparent 70%)',
          boxShadow: isListening
            ? '0 0 60px rgba(34,211,238,0.25), 0 0 120px rgba(34,211,238,0.1)'
            : isSpeaking
            ? '0 0 60px rgba(99,102,241,0.25), 0 0 120px rgba(99,102,241,0.1)'
            : '0 0 30px rgba(30,64,175,0.15)',
        }}
        animate={isActive ? { scale: [1, 1.06, 1] } : { scale: [1, 1.03, 1] }}
        transition={{ duration: isActive ? 1.2 : 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="relative z-10 rounded-full flex items-center justify-center overflow-hidden"
        style={{ width: '66%', height: '66%' }}
        animate={
          isListening
            ? { scale: [1, 1.07, 1.02, 1.08, 1] }
            : isActive
            ? { scale: [1, 1.04, 1] }
            : { scale: 1 }
        }
        transition={{
          duration: isListening ? 0.8 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className="absolute inset-0 rounded-full transition-all duration-700"
          style={{
            background: isListening
              ? 'radial-gradient(circle at 35% 35%, #22d3ee 0%, #0891b2 45%, #0c4a6e 100%)'
              : isSpeaking
              ? 'radial-gradient(circle at 35% 35%, #818cf8 0%, #4f46e5 45%, #1e1b4b 100%)'
              : status === 'Error'
              ? 'radial-gradient(circle at 35% 35%, #f87171 0%, #dc2626 45%, #450a0a 100%)'
              : 'radial-gradient(circle at 35% 35%, #1e3a5f 0%, #0f172a 60%, #0a0f1c 100%)',
          }}
        />

        {isListening && (
          <div className="relative z-10 flex items-center gap-0.5">
            {[0.2, 0.5, 0.1, 0.7, 0.3, 0.8, 0.4].map((delay, i) => (
              <motion.div
                key={i}
                className="w-0.5 rounded-full bg-white/80"
                animate={{ height: ['4px', '16px', '8px', '20px', '6px'] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}

        {(status === 'Thinking' || isConnecting) && (
          /* AI Thinking Waveform */
          <div className="flex items-center justify-center gap-1.5 h-12">
            <div className="w-1.5 h-5 bg-cyan-400 rounded-full animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
            <div className="w-1.5 h-8 bg-cyan-400 rounded-full animate-[pulse_1.2s_ease-in-out_infinite_0.2s] shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
            <div className="w-1.5 h-5 bg-cyan-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_0.4s] shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status }: { status: VoiceStatus }) {
  const configs: Record<VoiceStatus, { label: string; color: string; dot: string }> = {
    Idle:       { label: 'System Idle',   color: 'rgba(71,85,105,0.8)',   dot: '#475569' },
    Connecting: { label: 'Connecting...', color: 'rgba(56,189,248,0.15)', dot: '#38bdf8' },
    Listening:  { label: 'Listening...',  color: 'rgba(34,211,238,0.15)', dot: '#22d3ee' },
    Thinking:   { label: 'Thinking...',   color: 'rgba(251,191,36,0.12)', dot: '#fbbf24' },
    Speaking:   { label: 'Speaking...',   color: 'rgba(167,139,250,0.15)', dot: '#a78bfa' },
    Error:      { label: 'Connection Error', color: 'rgba(239,68,68,0.15)', dot: '#ef4444' },
  }
  const cfg = configs[status]

  return (
    <motion.div
      key={status}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide"
      style={{
        background: cfg.color,
        border: `1px solid ${cfg.dot}30`,
        color: cfg.dot === '#475569' ? '#64748b' : cfg.dot,
      }}
    >
      <motion.span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: cfg.dot }}
        animate={status !== 'Idle' && status !== 'Error' ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : {}}
        transition={{ duration: 0.9, repeat: Infinity }}
      />
      {cfg.label}
    </motion.div>
  )
}

// ── Tailwind Styled Markdown Definitions for Voice Panel ───────
const mdComponents: Record<string, React.FC<any>> = {
  p: ({ children }) => (
    <p className="leading-relaxed text-slate-300 mb-4 last:mb-0 text-xs sm:text-sm font-normal">{children}</p>
  ),
  h1: ({ children }) => (
    <h1 className="font-semibold text-white text-base mt-5 mb-2 first:mt-0 tracking-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-semibold text-white text-sm mt-4 mb-1.5 first:mt-0 tracking-tight">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-semibold text-white text-xs mt-3 mb-1 first:mt-0 uppercase tracking-wider">{children}</h3>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-sky-400">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-slate-300 italic">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1.5 my-3 ml-4 list-disc text-slate-300 text-xs sm:text-sm">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1.5 my-3 ml-5 list-decimal text-slate-300 text-xs sm:text-sm">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="px-1.5 py-0.5 rounded bg-white/10 text-sky-300 text-[11px] font-mono">{children}</code>
    ) : (
      <pre className="p-3 my-2 rounded-xl bg-slate-950/80 border border-white/10 overflow-x-auto text-[11px] font-mono text-slate-300">
        <code>{children}</code>
      </pre>
    ),
  table: ({ children }) => (
    <div className="my-4 w-full overflow-x-auto rounded-lg border border-white/10 bg-slate-900/80 shadow-md">
      <table className="w-full text-left text-xs text-slate-200 border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-sky-950/60 text-[11px] font-semibold uppercase tracking-wider text-sky-300 border-b border-white/10">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-white/10">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-white/[0.04] transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 font-semibold text-sky-300 border-b border-white/10">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-slate-300 leading-relaxed align-top">{children}</td>
  ),
}

// ── Dynamic Karaoke Speaking Highlight Component ──────────────
function KaraokeMarkdown({
  text,
  isSpeaking,
  isLatest,
}: {
  text: string
  isSpeaking: boolean
  isLatest: boolean
}) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!isSpeaking || !isLatest) {
      setProgress(100)
      return
    }

    setProgress(0)
    const words = text.trim().split(/\s+/).length
    // Speech rate: ~3.2 words per second -> 312ms per word
    const totalDurationMs = Math.max(2000, words * 312)
    const startTime = Date.now()

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const p = Math.min(100, (elapsed / totalDurationMs) * 100)
      setProgress(p)

      if (p >= 100) {
        clearInterval(interval)
      }
    }, 40) // 25fps smooth progressive wave

    return () => clearInterval(interval)
  }, [text, isSpeaking, isLatest])

  const cleanText = text
    .replace(/\[\d+\]/g, '')
    .replace(/\n\s*\.\s*\n/g, '\n')
    .trim()

  const isActiveHighlight = isSpeaking && isLatest && progress < 100

  return (
    <div className="relative font-sans select-text">
      <div
        className={`transition-all duration-200 ${
          isActiveHighlight
            ? 'drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]'
            : ''
        }`}
        style={
          isActiveHighlight
            ? {
                backgroundImage: `linear-gradient(135deg, #ffffff ${progress}%, #38bdf8 ${Math.min(
                  progress + 18,
                  100
                )}%, #475569 ${Math.min(progress + 36, 100)}%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }
            : undefined
        }
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{cleanText}</ReactMarkdown>
      </div>
    </div>
  )
}

// ── Transcript Line ───────────────────────────────────────────
function TranscriptEntry({
  line,
  index,
  isLatest,
  isSpeaking,
}: {
  line: TranscriptLine
  index: number
  isLatest: boolean
  isSpeaking: boolean
}) {
  const isUser = line.speaker === 'You'
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
      className="space-y-1.5 border-b border-white/[0.04] pb-3 last:border-none"
    >
      <div className="flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase">
        <span style={{ color: isUser ? '#22d3ee' : '#a78bfa' }}>
          {line.speaker}
        </span>
        <span style={{ color: '#475569' }}>{line.timestamp}</span>
      </div>

      {isUser ? (
        <p className="text-xs sm:text-sm leading-relaxed text-[#CBD5E1]">
          {line.text}
        </p>
      ) : (
        <KaraokeMarkdown
          text={line.text}
          isSpeaking={isSpeaking}
          isLatest={isLatest}
        />
      )}
    </motion.div>
  )
}

export default function VoicePage() {
  const user = useAuthStore((s) => s.user)
  const [status, setStatus] = useState<VoiceStatus>('Idle')
  const [interimText, setInterimText] = useState<string>('')
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState<boolean>(true)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isSessionActiveRef = useRef<boolean>(false)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const getFirstName = (): string => {
    if (!user) return 'there'
    return user.name?.split(' ')[0] || 'there'
  }

  useEffect(() => {
    const SRA = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SRA || !('speechSynthesis' in window)) setIsSupported(false)
  }, [])

  useEffect(() => () => { stopAllAudio() }, [])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript, interimText, status])

  const stopAllAudio = () => {
    isSessionActiveRef.current = false
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // Barge-in interrupt stops TTS playback immediately
    }
    try { recognitionRef.current?.stop() } catch {}
    setStatus('Idle')
    setInterimText('')
  }

  const handleInterruptBargeIn = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // Real TTS stop
    }
    if (isSessionActiveRef.current) {
      startListening()
    }
  }

  const speakText = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) { onEnd?.(); return }
    window.speechSynthesis.cancel()

    const clean = text
      .replace(/\[\d+\]/g, '')
      .replace(/[*_#`~]/g, '')
      .replace(/\n+/g, '. ')
      .trim()

    const utt = new SpeechSynthesisUtterance(clean)
    utt.rate = 1.0
    utt.pitch = 1.0
    utt.lang = 'en-US'

    utt.onend = () => { activeUtteranceRef.current = null; onEnd?.() }
    utt.onerror = () => { activeUtteranceRef.current = null; onEnd?.() }
    activeUtteranceRef.current = utt
    window.speechSynthesis.speak(utt)
  }

  const startListening = () => {
    if (!isSessionActiveRef.current) return
    const SRA = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SRA) { setErrorMessage("Voice not supported. Use Chrome/Edge."); setStatus('Error'); return }

    try {
      const r = new SRA()
      r.continuous = false; r.interimResults = true; r.lang = 'en-US'
      r.onstart = () => { setStatus('Listening'); setInterimText('') }
      r.onresult = (event: any) => {
        let interim = '', final = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript
          else interim += event.results[i][0].transcript
        }
        setInterimText(final || interim)
        if (final.trim()) { r.stop(); handleUserSpeechFinal(final.trim()) }
      }
      r.onerror = (e: any) => {
        if (e.error === 'not-allowed') { setErrorMessage('Microphone permission denied.'); setStatus('Error'); stopAllAudio() }
        else if (e.error === 'no-speech' && isSessionActiveRef.current) setTimeout(() => startListening(), 500)
      }
      r.onend = () => {
        if (isSessionActiveRef.current && status === 'Listening') startListening()
      }
      recognitionRef.current = r
      r.start()
    } catch { setStatus('Error') }
  }

  const handleUserSpeechFinal = async (userQuery: string) => {
    if (!userQuery.trim()) return
    setStatus('Thinking'); setInterimText('')
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setTranscript(p => [...p, { id: `usr-${Date.now()}`, speaker: 'You', text: userQuery, timestamp: ts }])

    try {
      let cid = conversationId
      if (!cid) {
        const nc = await apiPost<{ id: string }>('/conversations')
        cid = nc.id; setConversationId(cid)
      }
      const res = await apiPost<{ content: string; speechText?: string; citations?: CitationItem[] }>(
        `/conversations/${cid}/messages`, { content: userQuery }, { timeout: 90_000 }
      )
      const aiLine: TranscriptLine = {
        id: `ai-${Date.now()}`, speaker: 'Knowledge AI', text: res.content,
        citations: res.citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setTranscript(p => [...p, aiLine])
      if (isSessionActiveRef.current) {
        setStatus('Speaking')
        const textToSay = res.speechText || res.content
        speakText(textToSay, () => {
          if (isSessionActiveRef.current) startListening()
          else setStatus('Idle')
        })
      }
    } catch (err: any) {
      console.error('Voice query error:', err)
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout')
      const errText = isTimeout
        ? "The request timed out. Please try asking your question again."
        : "I encountered an error generating an answer. Please try again."

      toast.error('Voice Assistant', errText)
      const errLine: TranscriptLine = {
        id: `ai-err-${Date.now()}`,
        speaker: 'Knowledge AI',
        text: errText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setTranscript(p => [...p, errLine])

      if (isSessionActiveRef.current) {
        setStatus('Speaking')
        speakText(errText, () => {
          if (isSessionActiveRef.current) startListening()
          else setStatus('Idle')
        })
      } else {
        setStatus('Idle')
      }
    }
  }

  const startVoiceSession = () => {
    setErrorMessage(null)
    if (!isSupported) { setErrorMessage("Voice not supported. Use Chrome or Edge."); return }
    isSessionActiveRef.current = true
    setStatus('Connecting')

    setTimeout(() => {
      setStatus('Speaking')
      const greeting = `Hello ${getFirstName()}, what can I help you with today?`
      const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setTranscript([{ id: `ai-greet-${Date.now()}`, speaker: 'Knowledge AI', text: greeting, timestamp: ts }])
      speakText(greeting, () => { if (isSessionActiveRef.current) startListening() })
    }, 400)
  }

  const toggleMicSession = () => {
    if (status === 'Idle' || status === 'Error') startVoiceSession()
    else stopAllAudio()
  }

  const isActive = status !== 'Idle' && status !== 'Error'

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0E1A] text-[#F1F5F9] overflow-hidden p-4 sm:p-6">
      <AnimatePresence>
        {(!isSupported || errorMessage) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-5 py-3 text-sm bg-red-500/10 border-b border-red-500/20 text-red-400 mb-3 rounded-xl shrink-0"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage || 'Voice not supported. Please use Chrome or Edge.'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        {/* LEFT — Voice Command Center */}
        <div className="flex-1 relative rounded-2xl bg-[#121A2C] border border-[#1E293B] flex flex-col items-center justify-center p-6 space-y-6 overflow-hidden">
          <VoiceOrb status={status} />
          <StatusBadge status={status} />

          <p className="text-xs text-[#94A3B8] text-center max-w-xs leading-relaxed">
            {isActive
              ? 'Speak naturally — Knowledge AI is listening and searching your indexed documents.'
              : 'Start a hands-free voice session to ask questions about your knowledge base.'}
          </p>

          {/* Fixed Controls Row (Always visible) */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={toggleMicSession}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-lg ${
                isActive
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                  : 'bg-gradient-to-r from-[#3B82F6] to-[#38BDF8] text-white hover:scale-105'
              }`}
            >
              {isActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isActive ? 'End Session' : 'Start Session'}</span>
            </button>

            {status === 'Speaking' && (
              <button
                type="button"
                onClick={handleInterruptBargeIn}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-all cursor-pointer"
                title="Interrupt AI speech"
              >
                <VolumeX className="w-4 h-4" />
                <span>Interrupt</span>
              </button>
            )}

            {isActive && (
              <button
                type="button"
                onClick={stopAllAudio}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                title="End Call"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — Persistent Live Transcript Panel (Fixed height + internal scroll) */}
        <div className="w-full lg:w-[420px] shrink-0 rounded-2xl bg-[#121A2C] border border-[#1E293B] flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1E293B] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AudioLines className={`w-4 h-4 ${isActive ? 'text-[#38BDF8]' : 'text-[#64748B]'}`} />
              <span className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider">Live Transcript</span>
            </div>
            {status === 'Thinking' && (
              <span className="text-[10px] text-amber-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Grounding...
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
            {interimText && status === 'Listening' && (
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping mt-1.5 shrink-0" />
                <p className="text-xs italic text-[#38BDF8]">{interimText}</p>
              </div>
            )}

            {transcript.length === 0 && !interimText && (
              <div className="h-full flex items-center justify-center py-12 text-center text-[#64748B] text-xs">
                Tap 'Start Session' to begin live voice transcript.
              </div>
            )}

            {transcript.map((line, i) => (
              <TranscriptEntry
                key={line.id}
                line={line}
                index={i}
                isLatest={i === transcript.length - 1}
                isSpeaking={status === 'Speaking'}
              />
            ))}

            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
