// ============================================================
// Page 12 — Admin Datasets (/admin/datasets)
// Connected to Real FastAPI GET /api/v1/admin/datasets and POST /api/v1/admin/datasets/upload
// ============================================================

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, Plus, RefreshCw, Trash2, Loader2, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react'
import { Button, Card, Badge } from '@/components/ui'
import api, { apiGet, apiPost, apiDelete } from '@/services/api'
import { toast } from '@/store/uiStore'
import type { Document } from '@/types'

function StatusBadge({ status, chunks }: { status: string; chunks: number }) {
  const s = (status || '').toLowerCase()
  if (s === 'processing' || s === 'uploading') {
    return (
      <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        {s === 'uploading' ? 'Uploading...' : 'Processing...'}
      </span>
    )
  }
  if (s === 'ready' && chunks > 0) {
    return (
      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Ready
      </span>
    )
  }
  // error OR ready-but-zero-chunks
  return (
    <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" /> Failed to Parse
    </span>
  )
}

export default function AdminDatasetsPage() {
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [reindexingId, setReindexingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDatasets = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiGet<Document[]>('/admin/datasets')
      if (Array.isArray(data)) {
        setDatasets(data)
      }
    } catch (err) {
      console.error('Failed to fetch admin datasets:', err)
      setError("Couldn't load datasets — try refreshing")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatasets()
  }, [])

  // Auto-poll every 3s while any dataset is still being processed
  useEffect(() => {
    if (error) return
    const isProcessing = datasets.some(
      (d) => d.status === 'processing' || d.status === 'uploading'
    )
    if (!isProcessing) return
    const id = setInterval(fetchDatasets, 3000)
    return () => clearInterval(id)
  }, [datasets, error])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const files = Array.from(e.target.files)
    setUploading(true)

    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', 'General ML')

        await api.post('/admin/datasets/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        toast.success('KB Dataset Uploaded', `Successfully uploaded ${file.name} to global knowledge base.`)
      } catch (err: any) {
        console.error('Failed to upload KB dataset:', err)
        toast.error('Upload Failed', err.response?.data?.detail || `Failed to upload ${file.name}`)
      }
    }

    setUploading(false)
    fetchDatasets()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleReindex = async (datasetId: string, title: string) => {
    try {
      setReindexingId(datasetId)
      await apiPost(`/admin/datasets/${datasetId}/reindex`)
      toast.success('Re-indexing Started', `Dataset "${title}" graph re-indexed.`)
      await fetchDatasets()
    } catch (err) {
      console.error('Failed to reindex dataset:', err)
      toast.error('Reindex Failed', `Could not reindex ${title}`)
    } finally {
      setReindexingId(null)
    }
  }

  const handleDelete = async (datasetId: string, title: string) => {
    try {
      await apiDelete(`/admin/datasets/${datasetId}`)
      toast.success('Dataset Deleted', `Dataset "${title}" deleted from global knowledge base.`)
      await fetchDatasets()
    } catch (err) {
      console.error('Failed to delete dataset:', err)
      toast.error('Delete Failed', `Could not delete ${title}`)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-[#0A0E1A] text-[#F1F5F9]">
      {/* Hidden File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.docx,.txt,.md,.csv,.pptx"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F1F5F9]">Knowledge Base Datasets</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Manage global datasets accessible across enterprise user RAG queries.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          onClick={handleUploadClick}
          disabled={uploading}
        >
          {uploading ? 'Uploading Dataset...' : 'Upload Dataset'}
        </Button>
      </div>

      {/* SUMMARY STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-[#1E293B] bg-[#121A2C]">
          <p className="text-xs text-[#94A3B8]">Total KB Datasets</p>
          <p className="text-2xl font-bold text-[#F1F5F9] mt-1">{datasets.length}</p>
        </Card>

        <Card className="p-4 border-[#1E293B] bg-[#121A2C]">
          <p className="text-xs text-[#94A3B8]">Vector Store Status</p>
          <p className="text-2xl font-bold text-[#22C55E] mt-1">Qdrant Online</p>
        </Card>

        <Card className="p-4 border-[#1E293B] bg-[#121A2C]">
          <p className="text-xs text-[#94A3B8]">Total Storage Used</p>
          <p className="text-2xl font-bold text-[#38BDF8] mt-1">
            {(datasets.reduce((acc, d) => acc + (d.fileSize || 0), 0) / (1024 * 1024)).toFixed(2)} MB
          </p>
        </Card>
      </div>

      {/* DATASETS GRID */}
      <Card className="p-5 border-[#1E293B] bg-[#121A2C] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F1F5F9]">Global Knowledge Base Index ({datasets.length})</h3>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-[#38BDF8]" />}
        </div>

        {error ? (
          <div className="p-6 text-center border border-red-500/30 bg-red-500/10 rounded-xl space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-sm font-semibold text-red-300">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-red-300 border-red-500/40 hover:bg-red-500/20"
              onClick={fetchDatasets}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try Refreshing
            </Button>
          </div>
        ) : datasets.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-xl bg-[#0A0E1A] space-y-2">
            <Database className="w-10 h-10 text-[#64748B] mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-[#F1F5F9]">No shared KB datasets uploaded yet</p>
            <p className="text-[11px] text-[#94A3B8]">Upload shared documents to seed the global enterprise knowledge base.</p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-[#38BDF8] border-[#38BDF8]/40 hover:bg-[#38BDF8]/10 mt-3"
              onClick={handleUploadClick}
              disabled={uploading}
            >
              + Upload Global Dataset
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((d) => (
              <div key={d.id} className="p-4 rounded-xl border border-white/10 bg-[#0A0E1A] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#38BDF8]/10 text-[#38BDF8]">
                      {d.fileType}
                    </span>
                    <StatusBadge status={d.status} chunks={d.chunks || 0} />
                  </div>
                  <p className="text-xs font-bold text-[#F1F5F9] truncate" title={d.title}>{d.title}</p>
                  <p className="text-[10px] text-[#64748B] font-mono">
                    {((d.fileSize || 0) / 1024).toFixed(1)} KB • {d.chunks || 0} chunks
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleReindex(d.id, d.title)}
                      disabled={reindexingId === d.id}
                      className="flex items-center gap-1.5 text-[11px] text-[#38BDF8] hover:text-[#60A5FA] font-mono transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${reindexingId === d.id ? 'animate-spin' : ''}`} />
                      <span>{reindexingId === d.id ? 'Reindexing...' : 'Re-index'}</span>
                    </button>

                    {((d.status || '').toLowerCase() === 'ready' && (d.chunks || 0) > 0) && (
                      <button
                        onClick={() => navigate('/chat', { state: { initialContextDoc: { id: d.id, title: d.title, fileType: d.fileType, chunks: d.chunks, status: d.status } } })}
                        className="flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono transition-colors cursor-pointer"
                        title="Open AI Chat with this dataset pre-selected"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(d.id, d.title)}
                    className="p-1 text-[#64748B] hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete dataset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
