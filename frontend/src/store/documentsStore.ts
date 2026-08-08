// ============================================================
// Documents Store — Single Source of Truth Connected to Backend API
// Unified State between QuickUploadModal, Knowledge Base, and AI Studio
// ============================================================

import { create } from 'zustand'
import api, { apiGet, apiDelete } from '@/services/api'

export type FileType = 'PDF' | 'PPTX' | 'DOCX' | 'TXT' | 'MD' | 'CSV'

export interface DocumentItem {
  id: string
  title: string
  fileType: string
  size: string
  fileSize?: number
  vectorCount: number
  chunks?: number
  timestamp: string
  status: string
  active: boolean
  contentPreview?: string
  uploadedBy?: string
}

export interface BackendDocument {
  id: string
  title: string
  fileType?: string
  file_type?: string
  fileSize?: number
  file_size?: number
  status?: string
  createdAt?: string
  created_at?: string
  chunks?: number
  tokens?: number
  summary?: string
  uploadedBy?: string
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function mapBackendDocToItem(doc: BackendDocument, activeStateMap: Record<string, boolean>): DocumentItem {
  const fType = (doc.fileType || doc.file_type || 'TXT').toUpperCase()
  const bytes = doc.fileSize || doc.file_size || 0
  const created = doc.createdAt || doc.created_at || new Date().toISOString()
  const chunkCount = doc.chunks || 0

  return {
    id: doc.id,
    title: doc.title,
    fileType: fType,
    size: formatFileSize(bytes),
    fileSize: bytes,
    vectorCount: chunkCount,
    chunks: chunkCount,
    timestamp: new Date(created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: (doc.status || 'uploading').toUpperCase(),
    active: activeStateMap[doc.id] !== undefined ? activeStateMap[doc.id] : true,
    contentPreview: doc.summary || `Vectorized knowledge document ${doc.title}.`,
    uploadedBy: doc.uploadedBy
  }
}

interface DocumentsStore {
  documents: DocumentItem[]
  loading: boolean
  error: string | null
  activeStateMap: Record<string, boolean>
  fetchDocuments: () => Promise<DocumentItem[]>
  uploadDocument: (file: File) => Promise<DocumentItem>
  removeDocument: (id: string) => Promise<void>
  toggleDocumentActive: (id: string) => void
  setDocumentActive: (id: string, active: boolean) => void
  addDocument: (fileOrItem: File | Partial<DocumentItem>) => Promise<DocumentItem>
}

export const useDocumentsStore = create<DocumentsStore>()((set, get) => ({
  documents: [],
  loading: false,
  error: null,
  activeStateMap: {},

  fetchDocuments: async () => {
    try {
      set({ loading: true, error: null })
      const data = await apiGet<BackendDocument[]>('/documents')
      const mapped = (data || []).map((d) => mapBackendDocToItem(d, get().activeStateMap))
      set({ documents: mapped, loading: false, error: null })
      return mapped
    } catch (err) {
      console.error('Failed to fetch documents from API:', err)
      set({ loading: false, error: "Couldn't load datasets — try refreshing" })
      return get().documents
    }
  },

  uploadDocument: async (file: File) => {
    set({ loading: true })
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('is_knowledge_base', 'false')

      const res = await api.post<BackendDocument>('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const newDocItem = mapBackendDocToItem(res.data, get().activeStateMap)
      await get().fetchDocuments()
      set({ loading: false })
      return newDocItem
    } catch (err) {
      console.error('Failed to upload document:', err)
      set({ loading: false })
      throw err
    }
  },

  addDocument: async (fileOrItem: File | Partial<DocumentItem>) => {
    if (fileOrItem instanceof File) {
      return get().uploadDocument(fileOrItem)
    }
    // Fallback if item object passed
    await get().fetchDocuments()
    return get().documents[0]
  },

  removeDocument: async (id: string) => {
    try {
      await apiDelete(`/documents/${id}`)
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
      }))
    } catch (err) {
      console.error('Failed to delete document:', err)
    }
  },

  toggleDocumentActive: (id: string) => {
    set((state) => {
      const nextMap = { ...state.activeStateMap, [id]: !state.documents.find((d) => d.id === id)?.active }
      return {
        activeStateMap: nextMap,
        documents: state.documents.map((d) => (d.id === id ? { ...d, active: !d.active } : d)),
      }
    })
  },

  setDocumentActive: (id: string, active: boolean) => {
    set((state) => {
      const nextMap = { ...state.activeStateMap, [id]: active }
      return {
        activeStateMap: nextMap,
        documents: state.documents.map((d) => (d.id === id ? { ...d, active } : d)),
      }
    })
  },
}))
