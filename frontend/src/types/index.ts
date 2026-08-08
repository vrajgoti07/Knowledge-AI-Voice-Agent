// ============================================================
// Global Type Definitions — Khnowlge AI
// ============================================================

// ── User ──────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  plan: SubscriptionPlan
  createdAt: string
  updatedAt: string
}

export type UserRole = 'user' | 'admin' | 'moderator'
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise'

// ── Auth ──────────────────────────────────────────────────
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

// ── Document ──────────────────────────────────────────────
export interface Document {
  id: string
  title: string
  content?: string
  summary?: string
  fileType: DocumentFileType
  fileSize: number
  status: DocumentStatus
  tags: string[]
  category?: string
  uploadedBy: string
  createdAt: string
  updatedAt: string
  chunks?: number
  tokens?: number
  thumbnailUrl?: string
  sourceUrl?: string
}

export type DocumentFileType = 'pdf' | 'docx' | 'txt' | 'md' | 'csv' | 'xlsx' | 'pptx' | 'url' | 'image'
export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error' | 'archived'

// ── Chat / Message ────────────────────────────────────────
export interface Conversation {
  id: string
  title: string
  messages: Message[]
  documentIds: string[]
  createdAt: string
  updatedAt: string
  model?: string
  pinned?: boolean
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  citations?: Citation[]
  timestamp: string
  isStreaming?: boolean
  model?: string
  tokens?: number
  error?: string
}

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Citation {
  id: string
  documentId: string
  documentTitle: string
  excerpt: string
  page?: number
  chunk?: number
  score?: number
  url?: string
}

// ── Knowledge Base ────────────────────────────────────────
export interface KnowledgeCategory {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  documentCount: number
  createdAt: string
}

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  excerpt: string
  score: number
  source: string
  documentId?: string
  conversationId?: string
  url?: string
  createdAt: string
}

export type SearchResultType = 'document' | 'conversation' | 'message' | 'category'

// ── Analytics ─────────────────────────────────────────────
export interface AnalyticsData {
  totalDocuments: number
  totalConversations: number
  totalQueries: number
  avgResponseTime: number
  documentsByType: Record<string, number>
  queriesOverTime: TimeSeriesPoint[]
  topDocuments: Array<{ id: string; title: string; queries: number }>
}

export interface TimeSeriesPoint {
  date: string
  value: number
}

// ── Voice ─────────────────────────────────────────────────
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

export interface VoiceSettings {
  language: string
  pitch: number
  rate: number
  volume: number
  voice?: string
}

// ── UI / State ────────────────────────────────────────────
export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface SidebarState {
  isOpen: boolean
  isCollapsed: boolean
  isPinned: boolean
  width: number
}

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: string
  shortcut?: string
  group: string
  action: () => void
}

// ── API ───────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: Record<string, string[]>
}

// ── Navigation ────────────────────────────────────────────
export interface NavItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavItem[]
  external?: boolean
}

// ── Generic Helpers ───────────────────────────────────────
export type Maybe<T> = T | null | undefined
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export interface WithChildren {
  children: React.ReactNode
}

export interface WithClassName {
  className?: string
}

export interface BaseComponentProps extends WithChildren, WithClassName {}
