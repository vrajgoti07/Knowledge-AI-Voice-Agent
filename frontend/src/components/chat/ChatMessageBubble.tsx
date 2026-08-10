// ============================================================
// ChatMessageBubble — Clean Document Canvas Layout
// Removes all [1], [2] citation tags and renders markdown prose with GFM table support
// User Prompt: Prominent heading text-xl font-semibold text-white
// AI Response: Typeset document, Volume2 TTS audio playback button, clean markdown prose
// ============================================================
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkles, Copy, Check, Volume2, VolumeX } from 'lucide-react'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  citations?: any[]
  timestamp?: string
  model?: string
  error?: string
  degraded?: boolean
  speechText?: string
}

interface Props {
  message: Message
  index: number
}

// Clean text function to strip [1], [2] tags and standalone periods
function sanitizeText(content: string): string {
  if (!content) return ''
  return content
    .replace(/\[\d+\]/g, '')               // Remove numeric citation markers [1], [2]
    .replace(/\n\s*\.\s*\n/g, '\n')         // Remove standalone dot on its own line
    .replace(/From:\s*[^\n]+/g, '')          // Remove leftover From: lines
    .trim()
}

// Markdown components for clean typeset prose & GFM tables
const mdComponents: Record<string, React.FC<any>> = {
  p: ({ children }) => (
    <p className="text-base text-slate-300 leading-loose mb-4 last:mb-0 font-normal">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="text-white font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-slate-400 italic">{children}</em>
  ),
  h1: ({ children }) => (
    <h1 className="text-lg font-bold text-white mt-6 mb-3 first:mt-0 tracking-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold text-white mt-5 mb-2 first:mt-0 tracking-tight">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-bold text-sky-300 tracking-wide mt-4 mb-2 first:mt-0">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="space-y-2 my-4 ml-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-2 my-4 ml-4 list-decimal text-slate-300">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 text-base text-slate-300 leading-loose">
      <span className="text-sky-400 mt-1 shrink-0 font-bold">•</span>
      <span className="flex-1">{children}</span>
    </li>
  ),
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-sky-300 text-xs font-mono border border-white/10">
        {children}
      </code>
    ) : (
      <pre className="my-4 p-4 rounded-xl bg-slate-900/80 border border-white/10 overflow-x-auto">
        <code className="text-xs font-mono text-slate-300 leading-relaxed">{children}</code>
      </pre>
    ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 pl-3 border-l-2 border-sky-400/40 text-slate-400 text-base leading-loose">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-6 w-full overflow-x-auto rounded-xl border border-white/10 bg-slate-900/80 shadow-xl">
      <table className="w-full text-left text-sm text-slate-200 border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-sky-950/60 text-xs font-semibold uppercase tracking-wider text-sky-300 border-b border-white/10">
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
    <th className="px-4 py-3 font-semibold text-sky-300 border-b border-white/10">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-slate-300 leading-relaxed align-top">{children}</td>
  ),
}

export function ChatMessageBubble({ message, index }: Props) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const cleanContent = sanitizeText(message.content)
  const textToSpeak = message.speechText ? message.speechText : cleanContent

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if (isPlaying) {
        window.speechSynthesis?.cancel()
      }
    }
  }, [isPlaying])

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Text-to-Speech (TTS) Voice Playback
  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) return

    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }

    window.speechSynthesis.cancel()

    const clean = textToSpeak
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[\d+\]/g, '')
      .replace(/[*_#`~]/g, '')
      .replace(/\|/g, ' ')
      .replace(/-{3,}/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!clean) return

    const rawSentences = clean.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
    if (rawSentences.length === 0) return

    setIsPlaying(true)
    let currentIndex = 0

    const speakNext = () => {
      if (currentIndex >= rawSentences.length) {
        setIsPlaying(false)
        return
      }

      const sentence = rawSentences[currentIndex]
      currentIndex++

      const utterance = new SpeechSynthesisUtterance(sentence)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.onend = () => speakNext()
      utterance.onerror = () => setIsPlaying(false)

      window.speechSynthesis.speak(utterance)
    }

    speakNext()
  }

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-full"
    >
      {isUser ? (
        /* ── USER PROMPT: Clean Prominent Heading ───────────────────────── */
        <div className="py-6 border-b border-white/[0.04]">
          <h2 className="text-xl sm:text-2xl font-semibold text-white leading-tight tracking-tight">
            {message.content}
          </h2>
        </div>
      ) : (
        /* ── AI SYNTHESIS: Typeset Document Canvas ────────────────────────── */
        <div className="py-6 space-y-4 group">
          {/* AI Header Line + Controls */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="font-medium text-slate-400">
                {message.degraded ? 'Raw Document Matches' : 'Synthesis'}
              </span>
              {message.degraded && (
                <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  AI offline — showing document excerpts
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {message.timestamp && (
                <span className="text-[11px] font-mono text-slate-600">{message.timestamp}</span>
              )}

              {/* TTS Voice Playback Button */}
              <button
                type="button"
                aria-label={isPlaying ? 'Stop listening' : 'Listen to response'}
                onClick={handleToggleSpeak}
                className={`p-1 rounded transition-all cursor-pointer opacity-70 group-hover:opacity-100 ${
                  isPlaying
                    ? 'text-sky-400 animate-pulse bg-sky-500/10'
                    : 'text-slate-500 hover:text-sky-400 hover:bg-white/[0.06]'
                }`}
                title={isPlaying ? 'Stop voice playback' : 'Listen to response'}
              >
                {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Copy Button */}
              <button
                type="button"
                aria-label="Copy AI response"
                onClick={handleCopy}
                className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                title="Copy text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Typeset Document Body (Clean prose without [1] or standalone dots) */}
          <div className="text-base text-slate-300 leading-loose">
            {message.error ? (
              <p className="text-sm text-red-400 font-medium">{message.error}</p>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents as any}>
                {cleanContent}
              </ReactMarkdown>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
