// ============================================================
// QuickUploadModal — Shared Document Upload Modal with Real File Picker
// Uses useDocumentsStore for Single Source of Truth Unified Document State
// ============================================================

import React, { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle2, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui'
import { useUIStore, toast } from '@/store/uiStore'
import { useDocumentsStore } from '@/store/documentsStore'

export function QuickUploadModal() {
  const { uploadModalOpen, setUploadModalOpen } = useUIStore()
  const uploadDocument = useDocumentsStore((s) => s.uploadDocument)

  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; status: 'uploading' | 'complete' | 'error' }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = async (fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList)
    if (fileArray.length === 0) return

    for (const file of fileArray) {
      setUploadedFiles((prev) => [{ name: file.name, status: 'uploading' }, ...prev])

      try {
        await uploadDocument(file)
        setUploadedFiles((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, status: 'complete' } : f))
        )
        toast.success('Document Indexed', `${file.name} uploaded and vectorized into RAG store.`)
      } catch (err: any) {
        console.error('Upload failed:', err)
        setUploadedFiles((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, status: 'error' } : f))
        )
        toast.error('Upload Failed', `Could not upload ${file.name}.`)
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Modal
      open={uploadModalOpen}
      onOpenChange={setUploadModalOpen}
      title="Upload Knowledge Source"
      description="Drag & drop PDFs, Docs, or Markdown to index into RAG vector store."
    >
      <div className="space-y-4">
        {/* Hidden Real File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.docx,.txt,.md,.csv,.pptx"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          className={`p-8 rounded-xl border-2 border-dashed text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-[#38BDF8] bg-[#38BDF8]/10'
              : 'border-white/10 hover:border-[#38BDF8]/40 bg-[#121A2C]/60'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-[#F1F5F9]">
            Click to browse or drag & drop real files here
          </p>
          <p className="text-[11px] text-[#94A3B8] mt-1">
            Supports PDF, DOCX, TXT, MD, CSV, PPTX (Max 50MB)
          </p>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#0A0E1A] border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 font-mono text-[#F1F5F9] truncate">
                  <FileText className="w-4 h-4 text-[#38BDF8] shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  {file.status === 'uploading' ? (
                    <span className="text-[#38BDF8] flex items-center gap-1 font-mono">
                      <Loader2 className="w-3 h-3 animate-spin" /> Uploading & Vectorizing...
                    </span>
                  ) : file.status === 'error' ? (
                    <span className="text-red-400 font-mono">Failed</span>
                  ) : (
                    <span className="text-[#22C55E] flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
