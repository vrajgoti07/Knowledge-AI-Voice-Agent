// ============================================================
// useChatSession — All chat state + API logic
// Fixes swallowed first message bug by decoupling thread creation from route refetches during active sends
// Unified message handler with strict optimistic updates
// ============================================================
import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiGet, apiPost, apiDelete } from '@/services/api'
import { toast } from '@/store/uiStore'
import type { Message } from '@/components/chat/ChatMessageBubble'
import type { Citation } from '@/components/chat/CitationBadges'

interface ContextDoc {
  id: string
  title: string
  fileType: string
  chunks: number
  status: string
}

interface ConversationSummary {
  id: string
  title: string
  messages: Message[]
  documentIds: string[]
  updatedAt: string
  createdAt: string
}

interface BackendMessage {
  id: string
  role: string
  content: string
  citations?: Citation[]
  timestamp?: string
  model?: string
  error?: string
}

interface BackendConversation {
  id: string
  title: string
  messages: BackendMessage[]
  documentIds: string[]
  updatedAt: string
  createdAt: string
}

function mapMessage(m: BackendMessage): Message {
  return {
    id: m.id,
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
    citations: m.citations ?? [],
    timestamp: m.timestamp,
    model: m.model,
    error: m.error,
  }
}

export function useChatSession(conversationId?: string) {
  const navigate = useNavigate()
  const location = useLocation()

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(conversationId ?? null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [contextFiles, setContextFiles] = useState<ContextDoc[]>([])
  const [contextPanelOpen, setContextPanelOpen] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)

  // Ref to prevent loadConversation from overriding optimistic message state during an active send
  const isSendingRef = useRef(false)

  // ── Load conversation list ────────────────────────────────
  const loadConversations = useCallback(async () => {
    setLoadingConvs(true)
    try {
      const data = await apiGet<BackendConversation[]>('/conversations')
      setConversations(data.map(c => ({
        ...c,
        messages: c.messages.map(mapMessage),
      })))
    } catch { /* toast shown elsewhere */ } finally {
      setLoadingConvs(false)
    }
  }, [])

  // ── Load a specific conversation ──────────────────────────
  const loadConversation = useCallback(async (id: string) => {
    if (isSendingRef.current) return
    try {
      const data = await apiGet<BackendConversation>(`/conversations/${id}`)
      setMessages(data.messages.map(mapMessage))
      setActiveId(id)

      if (data.documentIds && data.documentIds.length > 0) {
        const allDocs = await apiGet<ContextDoc[]>('/documents')
        const ctx = allDocs.filter(d => data.documentIds.includes(d.id))
        setContextFiles(ctx)
      } else {
        setContextFiles([])
      }
    } catch {
      toast.error('Error', 'Could not load conversation')
    }
  }, [])

  // ── Create new conversation ───────────────────────────────
  const createConversation = useCallback(async (): Promise<string | null> => {
    try {
      const newConv = await apiPost<BackendConversation>('/conversations')
      setConversations(prev => [{ ...newConv, messages: newConv.messages.map(mapMessage) }, ...prev])
      setActiveId(newConv.id)
      setMessages(newConv.messages.map(mapMessage))
      setContextFiles([])
      navigate(`/chat/${newConv.id}`, { replace: true })
      return newConv.id
    } catch {
      toast.error('Error', 'Could not create conversation')
      return null
    }
  }, [navigate])

  // ── Select conversation ───────────────────────────────────
  const selectConversation = useCallback(async (id: string) => {
    navigate(`/chat/${id}`)
    await loadConversation(id)
  }, [navigate, loadConversation])

  // ── Delete conversation ───────────────────────────────────
  const deleteConversation = useCallback(async (id: string) => {
    try {
      await apiDelete(`/conversations/${id}`)
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeId === id) {
        setActiveId(null)
        setMessages([])
        navigate('/chat')
      }
    } catch {
      toast.error('Error', 'Could not delete conversation')
    }
  }, [activeId, navigate])

  // ── Unified Send Message Handler (Strict try/catch/finally state management) ──
  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    isSendingRef.current = true

    // 1. Set optimistic UI and loading states
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, tempUserMsg])
    setIsThinking(true)
    setLoadingConvs(true)

    try {
      // 2. Await thread creation if this is the first message
      let targetId = activeId
      if (!targetId) {
        const newConv = await apiPost<BackendConversation>('/conversations')
        targetId = newConv.id
        setActiveId(targetId)
        navigate(`/chat/${targetId}`, { replace: true })
      }

      // 3. Post to backend LLM API
      const payload: Record<string, unknown> = { content: trimmed }
      // Only include READY documents — uploading/processing docs have no indexed chunks yet
      const readyContextFiles = contextFiles.filter(f => f.status === 'ready' && f.chunks > 0)
      if (readyContextFiles.length > 0) {
        payload.contextDocumentIds = readyContextFiles.map(f => f.id)
      }

      const res = await apiPost<BackendMessage>(`/conversations/${targetId}/messages`, payload, { timeout: 120_000 })
      const aiMsg = mapMessage(res)

      // 4. Update messages with the AI response
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempUserMsg.id)
        const userFinal: Message = {
          ...tempUserMsg,
          id: `user-${Date.now()}`,
        }
        return [...withoutTemp, userFinal, aiMsg]
      })

      // 5. Refresh sidebar threads list
      try {
        const updatedConvs = await apiGet<BackendConversation[]>('/conversations')
        setConversations(updatedConvs.map(c => ({
          ...c,
          messages: c.messages.map(mapMessage),
        })))
      } catch {
        /* sidebar list fetch non-critical */
      }
    } catch (error: any) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout')
      const isNetworkError = !error.response && (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK')
      let errorMsg: string
      if (isTimeout) {
        errorMsg = 'The AI took too long to respond. This can happen on the first query. Please try again — it will be faster next time.'
      } else if (isNetworkError) {
        errorMsg = 'Could not reach the backend server. Please check that the API server is running.'
      } else {
        errorMsg = error.response?.data?.detail || error.message || 'Failed to fetch AI response'
      }
      console.error('API Error Details:', error.response?.data || error.message || error)
      toast.error('Error', errorMsg)
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        tempUserMsg,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: errorMsg,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          citations: []
        }
      ])
    } finally {
      // 7. ALWAYS clear ALL loading states, even if the API fails
      setIsThinking(false)
      setLoadingConvs(false)
      isSendingRef.current = false
    }
  }, [activeId, contextFiles, navigate])

  // ── Context file management ───────────────────────────────
  const addContextFile = useCallback((doc: ContextDoc) => {
    setContextFiles(prev => {
      const exists = prev.findIndex(f => f.id === doc.id)
      if (exists >= 0) {
        // Update existing entry (e.g. status changed from uploading→ready)
        const updated = [...prev]
        updated[exists] = doc
        return updated
      }
      return [...prev, doc]
    })
  }, [])

  const removeContextFile = useCallback((id: string) => {
    setContextFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const updateContextFiles = useCallback((docs: ContextDoc[]) => {
    setContextFiles(docs)
  }, [])

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (conversationId && !isSendingRef.current) {
      loadConversation(conversationId)
    }
  }, [conversationId, loadConversation])

  useEffect(() => {
    const initDoc = (location.state as any)?.initialContextDoc
    if (initDoc && initDoc.id) {
      setContextFiles(prev => {
        if (prev.some(f => f.id === initDoc.id)) return prev
        return [...prev, {
          id: initDoc.id,
          title: initDoc.title || 'Document',
          fileType: initDoc.fileType || initDoc.file_type || 'PDF',
          chunks: initDoc.chunks || 0,
          status: initDoc.status || 'ready'
        }]
      })
    }
  }, [location.state])

  return {
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
    loadConversations,
  }
}
