// ============================================================
// DocumentsPage — Standalone Document Management Hub
// Connected to useDocumentsStore Zustand store & FastAPI documents API
// ============================================================

import React, { useState, useEffect, useRef } from 'react'
import {
  FileText, Upload, Trash2, Search, CheckCircle2, Loader2, AlertCircle
} from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'
import { useUIStore, toast } from '@/store/uiStore'
import { useDocumentsStore } from '@/store/documentsStore'

export default function DocumentsPage() {
  const { setPageTitle } = useUIStore()
  const { documents, fetchDocuments, uploadDocument, removeDocument, loading, error } = useDocumentsStore()
  const [search, setSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPageTitle('Documents')
    fetchDocuments()
  }, [setPageTitle, fetchDocuments])

  // Auto-poll document list while any document is in uploading/processing status
  useEffect(() => {
    if (error) return
    const isProcessing = documents.some(
      (d) => d.status?.toLowerCase() === 'processing' || d.status?.toLowerCase() === 'uploading'
    )
    if (!isProcessing) return

    const interval = setInterval(() => {
      fetchDocuments()
    }, 3000)

    return () => clearInterval(interval)
  }, [documents, fetchDocuments, error])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      for (const file of files) {
        try {
          const added = await uploadDocument(file)
          toast.success('Document Indexed', `${added.title} added to vector store.`)
        } catch (err) {
          toast.error('Upload Failed', `Could not upload ${file.name}`)
        }
      }
    }
  }

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-[#0A0E1A] text-[#F1F5F9]">
      {/* Hidden Real File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.docx,.txt,.md,.csv,.pptx"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F1F5F9]">My Documents</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Manage files vector-indexed for Voice AI RAG queries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-[#38BDF8]" />}
            className="w-64"
          />

          <Button
            variant="primary"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload File
          </Button>
        </div>
      </div>

      {/* DOCUMENTS GRID */}
      {error ? (
        <div className="p-6 text-center border border-red-500/30 bg-red-500/10 rounded-2xl space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm font-semibold text-red-300">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-red-300 border-red-500/40 hover:bg-red-500/20"
            onClick={fetchDocuments}
          >
            Try Refreshing
          </Button>
        </div>
      ) : loading && documents.length === 0 ? (
        <div className="py-20 text-center text-[#94A3B8] flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#38BDF8]" />
          <span>Loading documents from vector store...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl bg-[#121A2C]/60 space-y-3">
          <FileText className="w-12 h-12 text-[#64748B] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[#F1F5F9]">No documents uploaded yet</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            Upload PDF, DOCX, TXT, MD, or CSV files to build your personalized RAG knowledge memory.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-[#38BDF8] border-[#38BDF8]/40 hover:bg-[#38BDF8]/10 mt-2"
            onClick={() => fileInputRef.current?.click()}
          >
            + Upload First Document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <Card
              key={doc.id}
              className="p-5 border-white/10 bg-[#121A2C]/80 backdrop-blur-md flex flex-col justify-between gap-4 hover:border-[#38BDF8]/40 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                    {doc.fileType}
                  </span>

                  {(() => {
                    const st = doc.status?.toLowerCase()
                    const chunks = doc.chunks || 0
                    if (st === 'ready' && chunks > 0) {
                      return (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 border border-success/30 text-[11px] font-semibold text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ready</span>
                        </span>
                      )
                    }
                    if (st === 'processing' || st === 'uploading') {
                      return (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </span>
                      )
                    }
                    return (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-[11px] font-semibold text-red-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Failed to Parse</span>
                      </span>
                    )
                  })()}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#F1F5F9] truncate group-hover:text-[#38BDF8] transition-colors" title={doc.title}>
                    {doc.title}
                  </h4>
                  <p className="text-xs text-[#64748B] font-mono mt-1">
                    {doc.size} • {doc.chunks || 0} chunks
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#64748B]">{doc.timestamp}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await removeDocument(doc.id)
                    toast.info('Document Removed', `${doc.title} deleted.`)
                  }}
                  className="p-2 rounded-lg text-[#64748B] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
