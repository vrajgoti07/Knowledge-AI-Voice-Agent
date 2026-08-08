// ============================================================
// ChatInputBar — Frosted Glass Chat Input Pill Component
// Paperclip button triggers real hidden file input <input type="file" multiple />
// Renders file pills with remove 'x' buttons above input box
// Focus ring applied to outer container, textarea stripped of default focus rings
// ============================================================
import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, Mic, MicOff, Paperclip, X, FileText, Search, CheckCircle2, Loader2 } from 'lucide-react'
import { apiGet, apiPostFormData } from '@/services/api'
import { toast } from '@/store/uiStore'

export interface ContextDoc {
  id: string
  title: string
  fileType: string
  chunks: number
  status: string
}

interface Props {
  onSend: (content: string) => void
  isDisabled?: boolean
  contextFiles?: ContextDoc[]
  onAddContext?: (doc: ContextDoc) => void
  onRemoveContext?: (id: string) => void
}

function InlinePickerModal({
  onSelect,
  onClose,
  already,
}: {
  onSelect: (doc: ContextDoc) => void
  onClose: () => void
  already: string[]
}) {
  const [docs, setDocs] = useState<ContextDoc[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchDocs = async (q: string) => {
    setLoading(true)
    try {
      const all = await apiGet<ContextDoc[]>('/documents?scope=all')
      setDocs(
        all.filter(
          d =>
            d.status === 'ready' &&
            d.title.toLowerCase().includes(q.toLowerCase())
        )
      )
    } catch { /* empty */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocs('')
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#121A2C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">Attach Context Document</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close picker"
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0A0E1A] border border-white/10">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search indexed documents..."
              value={search}
              onChange={e => { setSearch(e.target.value); fetchDocs(e.target.value) }}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {loading ? (
              <div className="space-y-2 p-2">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            ) : docs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500">No ready documents found</p>
              </div>
            ) : (
              docs.map(doc => {
                const isAdded = already.includes(doc.id)
                return (
                  <button
                    key={doc.id}
                    type="button"
                    disabled={isAdded}
                    onClick={() => { onSelect(doc); onClose() }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      isAdded
                        ? 'opacity-50 cursor-not-allowed bg-white/5'
                        : 'hover:bg-white/[0.04] cursor-pointer'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{doc.title}</p>
                      <p className="text-[10px] text-slate-400">{doc.chunks} chunks · {doc.fileType}</p>
                    </div>
                    {isAdded && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function ChatInputBar({
  onSend,
  isDisabled = false,
  contextFiles = [],
  onAddContext,
  onRemoveContext,
}: Props) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [text])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isDisabled) return
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
      <div className="bg-[#121A2C]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl space-y-2 transition-all focus-within:border-sky-500/60 focus-within:ring-1 focus-within:ring-sky-500/30">

        {/* Attached Context Files Pills Row */}
        {contextFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-white/[0.06]">
            <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider mr-1">
              Context Files ({contextFiles.length}):
            </span>
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
                  <FileText className="w-3.5 h-3.5 shrink-0" />
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
                  className="hover:text-red-400 cursor-pointer ml-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Controls Row */}
        <div className="flex items-end gap-2">
          {/* Paperclip attachment button */}
          <button
            type="button"
            aria-label="Attach document file"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled || uploading}
            title="Upload & attach local document file"
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border bg-white/[0.04] border-white/10 text-slate-400 hover:text-sky-400 hover:border-sky-500/30 disabled:opacity-40"
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
            placeholder="Ask anything about your documents... (Enter to send, Shift+Enter for newline)"
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
                ? 'bg-gradient-to-br from-blue-500 to-sky-400 text-white shadow-lg shadow-sky-500/25 hover:scale-105 active:scale-95'
                : 'bg-white/[0.04] border border-white/10 text-slate-500'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document Picker Modal */}
      <AnimatePresence>
        {pickerOpen && onAddContext && (
          <InlinePickerModal
            onSelect={onAddContext}
            onClose={() => setPickerOpen(false)}
            already={contextFiles.map(f => f.id)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
