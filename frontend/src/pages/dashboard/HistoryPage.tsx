// ============================================================
// HistoryPage (/history)
// Real search filter (title + message content) + deep-link to /chat/:id
// ============================================================

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Sparkles, MessageSquare, ExternalLink, Clock, Layers, GitCompare } from 'lucide-react'
import { Input } from '@/components/ui'
import { apiGet } from '@/services/api'

interface DialogueMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  created_at?: string
  createdAt?: string
  model?: string
  is_comparison?: boolean
  isComparison?: boolean
  citations?: {
    id: string
    documentTitle?: string
    document_title?: string
    excerpt: string
    page?: number
  }[]
}

interface ConversationItem {
  id: string
  title: string
  createdAt: string
  documentIds?: string[]
  messages: DialogueMessage[]
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [threads, setThreads] = useState<ConversationItem[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true)
        const data = await apiGet<ConversationItem[]>('/conversations')
        if (Array.isArray(data) && data.length > 0) {
          setThreads(data)
          setSelectedThreadId(data[0].id)
        } else {
          setThreads([])
        }
      } catch {
        setThreads([])
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  // Search filter across BOTH title AND message contents
  const filteredThreads = threads.filter((t) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    const titleMatch = t.title.toLowerCase().includes(q)
    const contentMatch = t.messages?.some(m => m.content.toLowerCase().includes(q))
    return titleMatch || contentMatch
  })

  const activeThread = threads.find((t) => t.id === selectedThreadId) || filteredThreads[0]

  return (
    <div className="h-[calc(100vh-64px-4rem)] flex flex-col space-y-6 text-[#F1F5F9] max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9] tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 text-[#38BDF8]" />
            Conversation History
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Review and search past AI research sessions and citations.
          </p>
        </div>

        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by title or message content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-[#38BDF8]" />}
          />
        </div>
      </div>

      {/* DUAL-COLUMN LAYOUT */}
      {threads.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#1E293B] rounded-2xl bg-[#121A2C] text-center p-8 space-y-3">
          <MessageSquare className="w-12 h-12 text-[#64748B] opacity-50" />
          <h3 className="text-base font-bold text-[#F1F5F9]">No Saved Conversations Yet</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm">
            Start a new research session in AI Chat to view saved thread history here.
          </p>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-xs font-semibold hover:bg-[#2563EB] transition-all"
          >
            Start New Chat →
          </Link>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden">
          {/* LEFT PANEL: THREADS LIST */}
          <div className="w-full md:w-[320px] h-full glass-card p-4 flex flex-col shrink-0 overflow-y-auto space-y-2 shadow-xl">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
              Sessions ({filteredThreads.length})
            </p>

            {filteredThreads.length === 0 ? (
              <p className="text-xs text-[#64748B] text-center py-6">No matching sessions found</p>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                    selectedThreadId === thread.id
                      ? 'bg-white/[0.08] border-[#38BDF8]/50 shadow-[0_0_15px_rgba(56,189,248,0.12)]'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/15'
                  }`}
                >
                  <p className="text-xs font-bold text-[#F1F5F9] truncate" title={thread.title}>
                    {thread.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] font-mono flex-wrap">
                    <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{thread.messages?.length || 0} msgs</span>
                    {thread.messages?.some(m => m.isComparison || m.is_comparison || (m.model && m.model.toLowerCase().includes('comparison'))) && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent-primary/15 text-accent-light border border-accent-primary/30">
                          <GitCompare className="w-2.5 h-2.5 text-accent-light" />
                          <span>compare</span>
                        </span>
                      </>
                    )}
                    {thread.documentIds && thread.documentIds.length > 1 && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          <Layers className="w-2.5 h-2.5 text-sky-400" />
                          <span>{thread.documentIds.length} docs</span>
                        </span>
                      </>
                    )}
                    {thread.documentIds && thread.documentIds.length === 1 && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/10">
                          <span>1 doc</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT PANEL: VERBATIM DIALOGUE FEED */}
          <div className="flex-1 h-full glass-card p-6 overflow-y-auto space-y-6 shadow-2xl">
            {activeThread ? (
              <div className="space-y-6">
                <div className="pb-4 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold text-[#F1F5F9]">{activeThread.title}</h3>
                      {activeThread.documentIds && activeThread.documentIds.length > 1 && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          <Layers className="w-3 h-3 text-sky-400" />
                          <span>{activeThread.documentIds.length} Documents Scoped</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#64748B] font-mono mt-0.5">Session ID: {activeThread.id}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/chat/${activeThread.id}`)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/40 text-xs font-semibold text-[#60A5FA] hover:bg-[#3B82F6]/30 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in AI Chat</span>
                  </button>
                </div>

                <div className="space-y-5">
                  {activeThread.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-2xl space-y-2">
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B]">
                          {msg.role === 'assistant' ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1 text-success font-bold">
                                <Sparkles className="w-3.5 h-3.5" /> Gemini 2.5 Flash
                              </span>
                              {(msg.isComparison || msg.is_comparison || (msg.model && msg.model.toLowerCase().includes('comparison'))) && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-light border border-accent-primary/35">
                                  <GitCompare className="w-3 h-3 text-accent-light" />
                                  <span>Comparison Analysis</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#38BDF8] font-bold">User</span>
                          )}
                          <span>• {msg.timestamp || (msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now')}</span>
                        </div>

                        <div
                          className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed shadow-md ${
                            msg.role === 'user'
                              ? 'bg-[#121A2C] border-[#1E293B] text-[#F1F5F9]'
                              : 'bg-[#121A2C] border-[#1E293B] text-[#CBD5E1]'
                          }`}
                        >
                          <p>{msg.content}</p>

                          {msg.citations && msg.citations.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#1E293B] space-y-2">
                              {msg.citations.map((c, i) => (
                                <div key={i} className="p-2.5 rounded-xl bg-[#0A0E1A] border border-[#38BDF8]/30 font-mono text-xs">
                                  <p className="text-[10px] text-[#38BDF8] font-bold">
                                    Citation: {c.documentTitle} (Page {c.page || 1})
                                  </p>
                                  <p className="text-xs text-[#94A3B8] italic mt-0.5">"{c.excerpt}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-[#64748B]">
                Select a conversation session to view messages.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
