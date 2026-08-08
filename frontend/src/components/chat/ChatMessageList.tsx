// ============================================================
// ChatMessageList — Document Canvas Stream (ChatGPT / Claude Style)
// Rendered inside flex-1 overflow-y-auto scrollable area
// Minimal ChatGPT-style greeting empty state: "How can I help you today?" + suggestion pills
// ============================================================
import { useEffect, useRef } from 'react'
import { Sparkles, FileText, BarChart2, Compass, Layers } from 'lucide-react'
import { ChatMessageBubble, type Message } from './ChatMessageBubble'

interface Props {
  messages: Message[]
  isThinking: boolean
  onSelectSuggestion?: (text: string) => void
}

function GroundingIndicator() {
  return (
    <div className="py-6 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
        <Sparkles className="w-4 h-4 animate-spin text-sky-400" />
        <span>Synthesizing Document Answer...</span>
      </div>

      <div className="space-y-2">
        <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-white/10 rounded animate-pulse w-full" />
        <div className="h-3 bg-white/10 rounded animate-pulse w-5/6" />
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  { label: 'Summarize a document...', icon: FileText, prompt: 'Please summarize the key findings from my uploaded documents.' },
  { label: 'Compare datasets & metrics...', icon: BarChart2, prompt: 'Compare the core performance metrics across my datasets.' },
  { label: 'Analyze research trends...', icon: Compass, prompt: 'Identify major research trends and insights in the indexed files.' },
  { label: 'Extract executive summary...', icon: Layers, prompt: 'Extract a bulleted executive summary from my knowledge base.' },
]

export function ChatMessageList({ messages, isThinking, onSelectSuggestion }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isThinking])

  const visibleMessages = messages.filter(m => m.role !== 'system')

  if (visibleMessages.length === 0 && !isThinking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 h-full my-auto">
        <div className="max-w-2xl w-full mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-medium text-slate-200 tracking-tight">
              How can I help you today?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Ask any research question. Answers are generated using vector RAG search across your indexed files.
            </p>
          </div>

          {/* Suggestion Pills Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2">
            {SUGGESTIONS.map((item, idx) => {
              const Icon = item.icon
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectSuggestion?.(item.prompt)}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-sky-500/40 text-left transition-all cursor-pointer group shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 group-hover:text-sky-300 transition-colors truncate">
                      {item.label}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {visibleMessages.map((msg, i) => (
        <ChatMessageBubble key={msg.id} message={msg} index={i} />
      ))}
      {isThinking && <GroundingIndicator />}

      {/* Bottom padding block so last message isn't flush with pinned input */}
      <div className="h-10 flex-shrink-0" />
      <div ref={bottomRef} />
    </div>
  )
}
