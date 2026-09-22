// ============================================================
// ChatInputBar — Frosted Glass Chat Input Pill Component
// Paperclip button triggers real hidden file input <input type="file" multiple />
// Renders file pills with remove 'x' buttons above input box
// Focus ring applied to outer container, textarea stripped of default focus rings
// ============================================================
import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, Mic, MicOff, Paperclip, X, FileText, Search, CheckCircle2, Loader2, Layers, GitCompare } from 'lucide-react'
import { apiGet, apiPostFormData } from '@/services/api'
import { toast } from '@/store/uiStore'

import { MultiDocPickerModal } from './MultiDocPickerModal'

export interface ContextDoc {
  id: string
  title: string
  fileType: string
  chunks: number
  status: string
}

interface Props {
  onSend: (content: string, options?: { isCompare?: boolean; compareDocIds?: string[] }) => void
  isDisabled?: boolean
  contextFiles?: ContextDoc[]
  onAddContext?: (doc: ContextDoc) => void
  onRemoveContext?: (id: string) => void
  onUpdateContext?: (docs: ContextDoc[]) => void
}

export function ChatInputBar({
  onSend,
  isDisabled = false,
  contextFiles = [],
  onAddContext,
  onRemoveContext,
  onUpdateContext,
}: Props) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isCompareMode, setIsCompareMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [text])

  const toggleCompareMode = () => {
    const nextState = !isCompareMode
    setIsCompareMode(nextState)
    if (nextState) {
      toast.info(
        'Document Comparison Mode Active',
        'Select 2 or more documents to contrast similarities, differences, and unique additions.'
      )
      if (contextFiles.length < 2) {
        setPickerOpen(true)
      }
    }
  }

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isDisabled) return

    if (isCompareMode) {
      const readyDocs = contextFiles.filter(f => f.status === 'ready' && f.chunks > 0)
      if (readyDocs.length < 2) {
        toast.error('Compare Mode', 'Please select at least 2 ready documents to compare.')
        setPickerOpen(true)
        return
      }
      onSend(trimmed, { isCompare: true, compareDocIds: readyDocs.map(f => f.id) })
      setText('')
      return
    }

    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const recognitionRef = useRef<any>(null)

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
    }
  }, [])

  const toggleMic = () => {
    if (recording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      setRecording(false)
      return
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      toast.error('Voice Dictation Unavailable', 'Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    try {
      const recognition = new SpeechRecognitionAPI()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      let baseText = text

      recognition.onstart = () => {
        setRecording(true)
        toast.info('Voice Dictation Active', 'Listening... Speak into your microphone.')
      }

      recognition.onresult = (event: any) => {
        let interim = ''
        let final = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptText = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            final += transcriptText
          } else {
            interim += transcriptText
          }
        }
        if (final) {
          baseText = baseText ? `${baseText.trim()} ${final}` : final
          setText(baseText)
        } else if (interim) {
          setText(baseText ? `${baseText.trim()} ${interim}` : interim)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          toast.error('Microphone Denied', 'Microphone access was denied. Please allow mic permissions.')
        } else if (event.error !== 'no-speech') {
          toast.error('Voice Error', `Voice dictation error: ${event.error}`)
        }
        setRecording(false)
      }

      recognition.onend = () => {
        setRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err)
      toast.error('Voice Error', 'Could not start microphone voice input.')
      setRecording(false)
    }
  }

  // Handle Real Local File Attachment with status polling
  const handleLocalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)

        const uploadedDoc = await apiPostFormData<ContextDoc>('/documents/upload', formData)
        if (uploadedDoc && onAddContext) {
          const docId = (uploadedDoc as any).id || `doc-${Date.now()}`
          const docTitle = (uploadedDoc as any).title || file.name
          const docFileType = (uploadedDoc as any).fileType || (uploadedDoc as any).file_type || file.type || 'document'
          const initialStatus = (uploadedDoc as any).status || 'uploading'

          onAddContext({
            id: docId,
            title: docTitle,
            fileType: docFileType,
            chunks: (uploadedDoc as any).chunks || 0,
            status: initialStatus,
          })

          // Poll status until 'ready' or 'error' (max 120s, every 3s)
          if (initialStatus !== 'ready') {
            let attempts = 0
            const pollId = setInterval(async () => {
              attempts++
              if (attempts > 40) { clearInterval(pollId); return }
              try {
                const st = await apiGet<{ status: string; chunks: number }>(`/documents/${docId}/status`)
                if (st.status === 'ready' || st.status === 'error') {
                  clearInterval(pollId)
                  if (onAddContext && st.status === 'ready') {
                    onAddContext({ id: docId, title: docTitle, fileType: docFileType, chunks: st.chunks || 0, status: 'ready' })
                  }
                }
              } catch { clearInterval(pollId) }
            }, 3000)
          }
        }
      }
      toast.success('Attached', `${files.length} file(s) uploaded — indexing in background`)
    } catch {
      toast.error('Upload Error', 'Could not upload file to context')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const hasText = text.trim().length > 0

  return (
    <>
      {/* Hidden File Input Trigger */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
        onChange={handleLocalFileSelect}
        className="hidden"
      />

      {/* Floating frosted-glass input box pill */}
      <div className={`relative bg-[#121A2C]/90 backdrop-blur-2xl border rounded-2xl p-3 shadow-2xl space-y-2.5 transition-all shadow-black/50 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent ${
        isCompareMode
          ? 'border-indigo-500/40 focus-within:border-indigo-500/70 focus-within:ring-2 focus-within:ring-indigo-500/25 focus-within:shadow-[0_0_30px_rgba(99,102,241,0.2)]'
          : 'border-white/10 focus-within:border-sky-500/60 focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:shadow-[0_0_30px_rgba(56,189,248,0.18)]'
      }`}>

        {/* Comparison Mode Banner */}
        {isCompareMode && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950/70 via-purple-950/40 to-indigo-950/60 border border-indigo-500/30 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <GitCompare className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-indigo-200">Comparison Mode</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">• Executive Overview, Similarities, Differences & Matrix</span>
            </div>
            <div className="flex items-center gap-2">
              {contextFiles.length < 2 ? (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="px-2 py-0.5 rounded-md bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono cursor-pointer transition-colors"
                >
                  + Pick 2+ Docs
                </button>
              ) : (
                <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  {contextFiles.length} docs ready
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsCompareMode(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-0.5 rounded hover:bg-white/5 transition-colors"
                title="Exit Comparison Mode"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Multi-Document Scope Status & Pills */}
        {contextFiles.length > 0 ? (
          <div className="space-y-2 pb-2 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 text-xs font-semibold cursor-pointer transition-all shadow-xs active:scale-95 group"
                title="Click to edit selected documents"
              >
                <Layers className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>
                  Chatting with {contextFiles.length} {contextFiles.length === 1 ? 'document' : 'documents'} ▾
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onUpdateContext) {
                    onUpdateContext([])
                  } else {
                    contextFiles.forEach(f => onRemoveContext?.(f.id))
                  }
                }}
                className="text-[10px] text-slate-400 hover:text-red-400 font-mono transition-colors cursor-pointer"
              >
                Clear all
              </button>
            </div>

            {/* Document Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {contextFiles.map(doc => (
                <div
                  key={doc.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shadow-xs border transition-colors ${
                    doc.status === 'ready'
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                      : doc.status === 'error'
                      ? 'bg-red-500/10 border-red-500/30 text-red-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {doc.status === 'ready' ? (
                    <FileText className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                  ) : doc.status === 'error' ? (
                    <FileText className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                  )}
                  <span className="max-w-[160px] truncate">{doc.title}</span>
                  {(doc.status === 'uploading' || doc.status === 'processing') && (
                    <span className="text-[9px] font-mono opacity-70">indexing…</span>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${doc.title}`}
                    onClick={() => onRemoveContext?.(doc.id)}
                    className="hover:text-red-400 cursor-pointer ml-0.5 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.04]">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-sky-300 border border-white/5 hover:border-sky-500/30 text-[11px] font-medium cursor-pointer transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400/80" />
              <span>Scope chat to specific documents (Multi-Select) ▾</span>
            </button>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Searching entire library</span>
          </div>
        )}

        {/* Main Controls Row */}
        <div className="flex items-end gap-2">
          {/* Multi-document library picker trigger button */}
          <button
            type="button"
            aria-label="Select context documents from library"
            onClick={() => setPickerOpen(true)}
            disabled={isDisabled}
            title="Select context documents from library (Multi-Doc RAG)"
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
              contextFiles.length > 0
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-400 hover:bg-sky-500/25'
                : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-sky-400 hover:border-sky-500/30'
            } disabled:opacity-40 shadow-xs`}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Document Comparison Mode Toggle Button */}
          <button
            type="button"
            aria-label={isCompareMode ? 'Disable Comparison Mode' : 'Enable Document Comparison Mode'}
            onClick={toggleCompareMode}
            disabled={isDisabled}
            title={isCompareMode ? 'Comparison Mode Active (Click to disable)' : 'Enable Document Comparison Mode (2+ docs)'}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
              isCompareMode
                ? 'bg-indigo-500/25 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500/40'
                : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30'
            } disabled:opacity-40 shadow-xs`}
          >
            <GitCompare className="w-4 h-4" />
          </button>

          {/* Paperclip upload attachment button */}
          <button
            type="button"
            aria-label="Upload document file"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled || uploading}
            title="Upload & attach local document file"
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border bg-white/[0.04] border-white/10 text-slate-400 hover:text-sky-400 hover:border-sky-500/30 disabled:opacity-40 shadow-xs"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-sky-400" /> : <Paperclip className="w-4 h-4" />}
          </button>

          {/* Mic button */}
          <button
            type="button"
            aria-label={recording ? 'Stop recording' : 'Start voice input'}
            onClick={toggleMic}
            disabled={isDisabled}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border disabled:opacity-40 ${
              recording
                ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Textarea — Stripped of default borders/rings to fix double-box bug */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isCompareMode
                ? contextFiles.length >= 2
                  ? `Ask a comparison question between ${contextFiles.slice(0, 2).map(f => f.title).join(' & ')}...`
                  : 'Select 2 or more documents to contrast similarities & differences...'
                : contextFiles.length > 1
                ? `Ask questions comparing or synthesizing ${contextFiles.length} selected documents...`
                : contextFiles.length === 1
                ? `Ask anything about ${contextFiles[0].title}...`
                : "Ask anything about your documents... (Enter to send, Shift+Enter for newline)"
            }
            disabled={isDisabled}
            rows={1}
            aria-label="Chat message input"
            style={{ resize: 'none', overflow: 'hidden', outline: 'none', boxShadow: 'none' }}
            className="w-full flex-1 bg-transparent border-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-none shadow-none text-sm text-white placeholder-slate-400 disabled:opacity-50 leading-relaxed px-2 py-1"
          />

          {/* Send button */}
          <button
            type="button"
            aria-label="Send message"
            onClick={handleSend}
            disabled={!hasText || isDisabled}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              hasText && !isDisabled
                ? isCompareMode
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95'
                  : 'bg-gradient-to-br from-blue-500 to-sky-400 text-white shadow-lg shadow-sky-500/25 hover:scale-105 active:scale-95'
                : 'bg-white/[0.04] border border-white/10 text-slate-500'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Multi-Document Picker Modal */}
      <MultiDocPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedDocs={contextFiles}
        mode={isCompareMode ? 'compare' : 'default'}
        onApply={(selectedDocs) => {
          if (onUpdateContext) {
            onUpdateContext(selectedDocs)
          } else {
            selectedDocs.forEach(d => onAddContext?.(d))
          }
        }}
      />
    </>
  )
}
