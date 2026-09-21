import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Sparkles, Copy, Check, Volume2, VolumeX, GitCompare, Split, CheckCircle2 } from 'lucide-react'
import { DocumentSourcesList, InlineCitationChip, type Citation } from './CitationBadges'
import { PDFViewerPanel } from './PDFViewerPanel'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  citations?: Citation[]
  timestamp?: string
  model?: string
  error?: string
  degraded?: boolean
  speechText?: string
  isComparison?: boolean
}

interface Props {
  message: Message
  index: number
}

// Clean text function to strip leftover system metadata and standalone periods
function sanitizeText(content: string): string {
  if (!content) return ''
  return content
    .replace(/\n\s*\.\s*\n/g, '\n')         // Remove standalone dot on its own line
    .replace(/From:\s*[^\n]+/g, '')          // Remove leftover From: lines
    .trim()
}

function getHeadingText(children: any): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) {
    return children.map(c => (typeof c === 'string' ? c : '')).join('')
  }
  return ''
}

export function ChatMessageBubble({ message, index }: Props) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeViewerCitation, setActiveViewerCitation] = useState<Citation | null>(null)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const cleanContent = sanitizeText(message.content)
  const textToSpeak = message.speechText ? message.speechText : cleanContent

  // Filter citations: show all citations when multiple documents are cited;
  // otherwise apply primary-document focus to protect single-doc queries
  const mainCitations = React.useMemo(() => {
    if (!message.citations || message.citations.length === 0) return []
    const distinctDocs = new Set(message.citations.map(c => c.documentId || c.documentTitle))
    if (distinctDocs.size > 1) {
      return [...message.citations].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    }
    const sorted = [...message.citations].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    const primaryDocKey = sorted[0]?.documentId || sorted[0]?.documentTitle
    const primaryScore = sorted[0]?.score ?? 0
    const normPrimary = primaryScore <= 1 ? primaryScore : primaryScore / 100

    return sorted.filter(c => {
      const docKey = c.documentId || c.documentTitle
      if (docKey === primaryDocKey) return true
      const itemScore = c.score ?? 0
      const normItem = itemScore <= 1 ? itemScore : itemScore / 100
      return normPrimary >= 0.50 && normItem >= Math.max(0.50, normPrimary * 0.90)
    })
  }, [message.citations])

  // Build citation map for quick lookup by index
  const citationMap = React.useMemo(() => {
    const map = new Map<number, Citation>()
    mainCitations.forEach((c, idx) => {
      map.set(idx + 1, c)
    })
    return map
  }, [mainCitations])

  const handleOpenPdf = (cit: Citation) => {
    setActiveViewerCitation(cit)
  }

  // Custom text renderer to parse [1], [2] into InlineCitationChip
  const mdComponents: Record<string, React.FC<any>> = {
    p: ({ children }) => {
      // Check if children contain text with [1], [2] citation markers
      const renderWithCitations = (node: any): any => {
        if (typeof node === 'string') {
          const parts = node.split(/(\[\d+\])/g)
          if (parts.length > 1) {
            return parts.map((part, i) => {
              const match = part.match(/^\[(\d+)\]$/)
              if (match) {
                const num = parseInt(match[1], 10)
                const cit = citationMap.get(num)
                return (
                  <InlineCitationChip
                    key={i}
                    num={num}
                    citation={cit}
                    onOpenPdf={handleOpenPdf}
                  />
                )
              }
              return part
            })
          }
        }
        return node
      }

      return (
        <p className="text-[15px] text-slate-300 leading-[1.85] mb-4 last:mb-0 font-normal">
          {React.Children.map(children, renderWithCitations)}
        </p>
      )
    },
    strong: ({ children }) => (
      <strong className="text-white font-semibold">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="text-slate-400 italic">{children}</em>
    ),
    h1: ({ children }) => (
      <h1 className="text-xl font-bold text-white mt-8 mb-4 first:mt-0 tracking-tight border-b border-white/[0.06] pb-2">{children}</h1>
    ),
    h2: ({ children }) => {
      const txt = getHeadingText(children)
      if (/similarit/i.test(txt)) {
        return (
          <div className="mt-8 mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_16px_rgba(16,185,129,0.08)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-200 tracking-wide m-0">{children}</h2>
              <span className="text-[10px] font-mono text-emerald-400/80">Shared Concepts & Overlapping Principles</span>
            </div>
          </div>
        )
      }
      if (/differenc/i.test(txt)) {
        return (
          <div className="mt-8 mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-[0_0_16px_rgba(245,158,11,0.08)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-200 tracking-wide m-0">{children}</h2>
              <span className="text-[10px] font-mono text-amber-400/80">Contrasting Formulations, Notations & Focus</span>
            </div>
          </div>
        )
      }
      return <h2 className="text-lg font-bold text-white mt-7 mb-3 first:mt-0 tracking-tight">{children}</h2>
    },
    h3: ({ children }) => {
      const txt = getHeadingText(children)
      if (/similarit/i.test(txt)) {
        return (
          <div className="mt-8 mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_16px_rgba(16,185,129,0.08)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-200 tracking-wide m-0">{children}</h3>
              <span className="text-[10px] font-mono text-emerald-400/80">Shared Concepts & Overlapping Principles</span>
            </div>
          </div>
        )
      }
      if (/differenc/i.test(txt)) {
        return (
          <div className="mt-8 mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-[0_0_16px_rgba(245,158,11,0.08)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-200 tracking-wide m-0">{children}</h3>
              <span className="text-[10px] font-mono text-amber-400/80">Contrasting Formulations, Notations & Focus</span>
            </div>
          </div>
        )
      }
      if (/addition|unique/i.test(txt)) {
        return (
          <div className="mt-8 mb-4 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_16px_rgba(99,102,241,0.08)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-indigo-200 tracking-wide m-0">{children}</h3>
              <span className="text-[10px] font-mono text-indigo-400/80">Distinctive Coverage in Specific Sources</span>
            </div>
          </div>
        )
      }
      return <h3 className="text-base font-semibold text-sky-300 tracking-wide mt-5 mb-2 first:mt-0">{children}</h3>
    },
    h4: ({ children }) => (
      <h4 className="text-sm font-semibold text-sky-200 mt-4 mb-2 first:mt-0">{children}</h4>
    ),
    ul: ({ children }) => (
      <ul className="space-y-2 my-4 ml-1">{children}</ul>
    ),
    ol: ({ children, start }) => (
      <ol className="space-y-2 my-4 ml-1 list-none counter-reset-list" start={start}>{children}</ol>
    ),
    li: ({ children, node, ordered, index: liIndex }) => {
      const isOrdered = ordered === true
      if (isOrdered) {
        return (
          <li className="flex gap-2.5 text-[15px] text-slate-300 leading-[1.85]">
            <span className="text-sky-400 shrink-0 font-semibold min-w-[1.5em] text-right">{typeof liIndex === 'number' ? `${liIndex + 1}.` : '•'}</span>
            <span className="flex-1">{children}</span>
          </li>
        )
      }
      return (
        <li className="flex gap-2.5 text-[15px] text-slate-300 leading-[1.85]">
          <span className="text-sky-400 mt-[2px] shrink-0 font-bold">•</span>
          <span className="flex-1">{children}</span>
        </li>
      )
    },
    code: ({ inline, className, children }: any) => {
      const match = /language-(\w+)/.exec(className || '')
      const lang = match ? match[1] : ''

      if (inline) {
        return (
          <code className="px-1.5 py-0.5 rounded bg-white/[0.07] text-sky-300 text-[13px] font-mono border border-white/10">
            {children}
          </code>
        )
      }
      return (
        <pre className="my-5 rounded-xl bg-[#0d1117] border border-white/10 overflow-x-auto shadow-lg">
          {lang && (
            <div className="px-4 py-2 text-[11px] font-mono text-slate-500 border-b border-white/[0.06] bg-white/[0.02]">
              {lang}
            </div>
          )}
          <code className={`block px-4 py-3 text-[13px] font-mono text-slate-300 leading-relaxed ${className || ''}`}>
            {children}
          </code>
        </pre>
      )
    },
    blockquote: ({ children }) => (
      <blockquote className="my-4 pl-4 border-l-2 border-sky-400/40 text-slate-400 text-[15px] leading-[1.85] bg-sky-500/[0.03] py-2 rounded-r-lg">
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr className="my-6 border-0 border-t border-white/[0.08]" />
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
      <tbody className="divide-y divide-white/[0.06]">{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-white/[0.04] transition-colors">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 font-semibold text-sky-300 border-b border-white/10 whitespace-nowrap">{children}</th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-slate-300 leading-relaxed align-top">{children}</td>
    ),
  }

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
      .replace(/\$\$[\s\S]*?\$\$/g, '')     // Remove display math for TTS
      .replace(/\$[^$]+\$/g, '')              // Remove inline math for TTS
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
          {message.isComparison && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs">
                <GitCompare className="w-3 h-3 text-indigo-400" />
                <span>Comparison Query</span>
              </span>
            </div>
          )}
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
              {message.isComparison && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-indigo-500/20 to-sky-500/20 text-sky-300 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                  <GitCompare className="w-3.5 h-3.5 text-sky-400" />
                  <span>Comparison Mode</span>
                </span>
              )}
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

          {/* Typeset Document Body — Rich markdown with math, tables, code */}
          <div className="ai-prose text-[15px] text-slate-300 leading-[1.85]">
            {message.error ? (
              <p className="text-sm text-red-400 font-medium">{message.error}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={mdComponents as any}
              >
                {cleanContent}
              </ReactMarkdown>
            )}
          </div>

          {/* Document Sources & Citations Component */}
          {mainCitations.length > 0 && (
            <DocumentSourcesList
              citations={mainCitations}
              onOpenPdf={handleOpenPdf}
            />
          )}

          {/* In-app PDF Viewer Slide-over Panel / Modal */}
          {activeViewerCitation && (
            <PDFViewerPanel
              isOpen={Boolean(activeViewerCitation)}
              onClose={() => setActiveViewerCitation(null)}
              documentId={activeViewerCitation.documentId || ''}
              documentTitle={activeViewerCitation.documentTitle || 'Document'}
              initialPage={activeViewerCitation.page}
              highlightExcerpt={activeViewerCitation.excerpt || ''}
              score={activeViewerCitation.score}
            />
          )}
        </div>
      )}
    </motion.div>
  )
}

