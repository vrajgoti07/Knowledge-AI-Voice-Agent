// ============================================================
// ChatPage — Document Canvas Shell with Collapsible Grouped History Sidebar
// Sidebar: Collapsible (+ New Thread, grouped by "Today", "Previous 7 Days", "Older")
// Canvas: Strict 3-part layout (Header, flex-1 overflow-y-auto Messages, flex-shrink-0 Pinned Input)
// ============================================================

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, MessageSquare, Sparkles, PanelLeft, PanelLeftClose, Download, Loader2, Layers } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/services/api'
import { useChatSession } from '@/hooks/useChatSession'
import { ChatMessageList } from '@/components/chat/ChatMessageList'
import { ChatInputBar } from '@/components/chat/ChatInputBar'
import { ContextFilePanel } from '@/components/chat/ContextFilePanel'

export default function ChatPage() {
  const { id: conversationId } = useParams<{ id: string }>()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const {
    conversations,
    activeId,
    messages,
    isThinking,
    contextFiles,
    contextPanelOpen,
    loadingConvs,
    setContextPanelOpen,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    addContextFile,
    removeContextFile,
    updateContextFiles,
  } = useChatSession(conversationId)

  const [isExporting, setIsExporting] = useState(false)

  const handleExportPdf = async () => {
    if (!activeId) return
    try {
      setIsExporting(true)
      const res = await api.get(`/conversations/${activeId}/export`, {
        responseType: 'blob',
      })

      // Extract filename from Content-Disposition header if available
      let filename = 'conversation-export.pdf'
      const disposition = res.headers['content-disposition']
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename=["']?([^"';]+)["']?/)
        if (match && match[1]) {
          filename = match[1]
        }
      } else {
        const currentConv = conversations.find(c => c.id === activeId)
        if (currentConv?.title) {
          const slug = currentConv.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
          filename = `${slug || 'conversation'}.pdf`
        }
      }

      // Trigger browser download via object URL
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('Conversation exported to PDF successfully')
    } catch (err: any) {
      console.error('[ExportPDF] Error downloading conversation export:', err)
      toast.error(err.response?.data?.detail || 'Failed to export conversation. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Helper to reliably parse UTC ISO strings even if 'Z' suffix is omitted
  const parseUtcDate = (iso?: string) => {
    if (!iso) return Date.now()
    let timeStr = String(iso).trim()
    if (!timeStr.endsWith('Z') && !timeStr.includes('+') && !timeStr.includes('-', 10)) {
      timeStr += 'Z'
    }
    const t = new Date(timeStr).getTime()
    return isNaN(t) ? Date.now() : t
  }

  // Group conversations into Today, Previous 7 Days, and Older
  const now = Date.now()
  const todayConvs = conversations.filter(c => {
    const time = parseUtcDate(c.updatedAt || c.createdAt)
    return (now - time) / (1000 * 3600) <= 24
  })
  const prev7DaysConvs = conversations.filter(c => {
    const time = parseUtcDate(c.updatedAt || c.createdAt)
    const diffHours = (now - time) / (1000 * 3600)
    return diffHours > 24 && diffHours <= 168
  })
  const olderConvs = conversations.filter(c => {
    const time = parseUtcDate(c.updatedAt || c.createdAt)
    return (now - time) / (1000 * 3600) > 168
  })

  function relativeTime(iso: string) {
    if (!iso) return 'just now'
    const time = parseUtcDate(iso)
    const diff = Math.floor((Date.now() - time) / 1000)
    if (isNaN(diff) || diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const renderConvItem = (conv: typeof conversations[0]) => {
    const docCount = conv.documentIds?.length || 0
    return (
      <div
        key={conv.id}
        className={`group relative flex items-start gap-2 p-2.5 rounded-xl cursor-pointer transition-all ${
          activeId === conv.id
            ? 'bg-[#121A2C] border border-white/10'
            : 'hover:bg-white/[0.03] border border-transparent'
        }`}
        onClick={() => selectConversation(conv.id)}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-200 truncate" title={conv.title}>
            {conv.title || 'Untitled Thread'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-500 font-mono">{relativeTime(conv.updatedAt)}</span>
            {docCount > 1 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-300 border border-sky-500/25">
                <Layers className="w-2.5 h-2.5 text-sky-400" />
                <span>{docCount} docs</span>
              </span>
            )}
            {docCount === 1 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/10">
                <span>1 doc</span>
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label={`Delete conversation ${conv.title}`}
          onClick={e => { e.stopPropagation(); deleteConversation(conv.id) }}
          className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all cursor-pointer p-1 rounded"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 h-full w-full bg-[#0A0E1A] text-slate-200 overflow-hidden select-none font-sans relative">

      {/* ── LEFT SIDEBAR: Collapsible Grouped History Panel ───────── */}
      {sidebarOpen && (
        <aside className="w-[260px] shrink-0 flex flex-col h-full bg-[#0D1220] border-r border-white/[0.06] transition-all">
          {/* New thread button */}
          <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => createConversation()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-sky-400 hover:bg-white/[0.08] hover:border-sky-500/30 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Thread</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Grouped Thread History List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {loadingConvs ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
              ))
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-5 h-5 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No threads yet</p>
              </div>
            ) : (
              <>
                {/* Today */}
                {todayConvs.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 font-semibold">
                      Today
                    </p>
                    {todayConvs.map(renderConvItem)}
                  </div>
                )}

                {/* Previous 7 Days */}
                {prev7DaysConvs.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 font-semibold pt-2">
                      Previous 7 Days
                    </p>
                    {prev7DaysConvs.map(renderConvItem)}
                  </div>
                )}

                {/* Older */}
                {olderConvs.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 font-semibold pt-2">
                      Older
                    </p>
                    {olderConvs.map(renderConvItem)}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      )}

      {/* ── MAIN RIGHT COLUMN CONTAINER ───────────────────────────── */}
      <div className="flex flex-col h-full relative overflow-hidden bg-[#0A0E1A] flex-1 min-w-0">

        {/* Minimalist Top Model Header with Sidebar Toggle & Export PDF Button */}
        <header className="h-12 border-b border-white/[0.04] bg-[#0A0E1A] flex items-center justify-between px-4 shrink-0 z-10">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                title="Expand sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Gemini 2.5 Flash</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Context Files Sidebar */}
            <button
              type="button"
              onClick={() => setContextPanelOpen(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 ${
                contextPanelOpen || contextFiles.length > 0
                  ? 'bg-sky-500/15 border-sky-500/30 text-sky-300 hover:bg-sky-500/25'
                  : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Toggle Context Documents Inspector"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">
                {contextFiles.length > 0
                  ? `${contextFiles.length} ${contextFiles.length === 1 ? 'Doc' : 'Docs'}`
                  : 'Scope Docs'}
              </span>
            </button>

            {activeId && messages.length > 0 ? (
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 hover:border-sky-500/30 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer active:scale-95"
                title="Export conversation as formatted PDF with citations"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span className="hidden sm:inline">
                  {isExporting ? 'Exporting...' : 'Export PDF'}
                </span>
              </button>
            ) : (
              <div className="w-2" />
            )}
          </div>
        </header>

        {/* 1. SCROLLABLE MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <ChatMessageList
            messages={messages}
            isThinking={isThinking}
            onSelectSuggestion={sendMessage}
          />
        </div>

        {/* 2. PINNED INPUT AREA (Strictly OUTSIDE the overflow-y-auto div) */}
        <div className="flex-shrink-0 w-full p-4 md:p-6 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A] to-transparent z-20">
          <div className="max-w-3xl mx-auto">
            <ChatInputBar
              onSend={sendMessage}
              isDisabled={isThinking}
              contextFiles={contextFiles}
              onAddContext={addContextFile}
              onRemoveContext={removeContextFile}
              onUpdateContext={updateContextFiles}
            />
          </div>
        </div>

      </div>

      {/* ── RIGHT SIDEBAR: Context Files Inspector Panel ──────────── */}
      {contextPanelOpen && (
        <ContextFilePanel
          contextFiles={contextFiles}
          onAdd={addContextFile}
          onRemove={removeContextFile}
          onUpdateContext={updateContextFiles}
          isOpen={contextPanelOpen}
          onClose={() => setContextPanelOpen(false)}
        />
      )}
    </div>
  )
}
