// ============================================================
// AdminDocumentsPage — Curated KB Repository Management
// ============================================================

import React, { useState, useEffect } from 'react'
import { Database, Search, Upload, RefreshCw, Trash2, Plus, FileText } from 'lucide-react'
import { Button, Input, Select, Card, Badge, Modal } from '@/components/ui'
import { useUIStore, toast } from '@/store/uiStore'

export interface KBDocument {
  id: string
  title: string
  category: string
  size: string
  chunks: number
  status: 'indexed' | 'indexing' | 'queued'
  lastReindexed: string
}

const INITIAL_KB_DOCS: KBDocument[] = [
  { id: 'kb-1', title: 'Attention_Is_All_You_Need.pdf', category: 'Research Papers', size: '2.4 MB', chunks: 420, status: 'indexed', lastReindexed: 'Today' },
  { id: 'kb-2', title: 'LangChain_LCEL_Architecture.pdf', category: 'LangChain & Agentic Workflows', size: '3.8 MB', chunks: 680, status: 'indexed', lastReindexed: 'Yesterday' },
  { id: 'kb-3', title: 'DeepSeek_V3_Technical_Report.pdf', category: 'LLMs & RAG', size: '5.4 MB', chunks: 920, status: 'indexed', lastReindexed: '3d ago' },
  { id: 'kb-4', title: 'PyTorch_Tensor_Operations_Guide.pdf', category: 'Python & Data Science', size: '1.9 MB', chunks: 310, status: 'indexing', lastReindexed: 'Just now' },
  { id: 'kb-5', title: 'Dense_Vector_Retrieval_Benchmarks.pdf', category: 'Deep Learning', size: '2.1 MB', chunks: 450, status: 'indexed', lastReindexed: '1w ago' },
]

const KB_CATEGORIES = [
  'Machine Learning',
  'Deep Learning',
  'Python & Data Science',
  'LLMs & RAG',
  'LangChain & Agentic Workflows',
  'Research Papers',
]

export default function AdminDocumentsPage() {
  const { setPageTitle } = useUIStore()
  const [docs, setDocs] = useState<KBDocument[]>(INITIAL_KB_DOCS)
  const [search, setSearch] = useState('')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState(KB_CATEGORIES[0])

  useEffect(() => {
    setPageTitle('Admin — KB Repository')
  }, [setPageTitle])

  const handleDelete = (id: string, title: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id))
    toast.info('Document Removed', `${title} deleted from KB store.`)
  }

  const handleReindex = (title: string) => {
    toast.success('Re-indexing', `Re-indexing vectors for ${title}...`)
  }

  const handleUploadKB = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newDoc: KBDocument = {
      id: `kb-${Date.now()}`,
      title: newTitle.endsWith('.pdf') ? newTitle : `${newTitle}.pdf`,
      category: newCategory,
      size: '3.2 MB',
      chunks: 350,
      status: 'indexed',
      lastReindexed: 'Just now',
    }

    setDocs([newDoc, ...docs])
    setNewTitle('')
    setUploadModalOpen(false)
    toast.success('KB Document Added', `${newDoc.title} added to ${newCategory}.`)
  }

  const filtered = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Curated Knowledge Base Repository</h1>
          <p className="text-xs text-text-secondary">Manage system-wide KB documents, assign research categories, and trigger vector re-indexing.</p>
        </div>

        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setUploadModalOpen(true)}>
          Add Document to KB
        </Button>
      </div>

      <Card className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search KB documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>
        <span className="text-xs font-mono text-text-muted">{filtered.length} Curated KB Papers</span>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-secondary border-b border-border text-text-muted font-mono uppercase text-[10px]">
              <tr>
                <th className="p-4">Document Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Size</th>
                <th className="p-4">Vector Chunks</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="p-4 font-bold text-text-primary">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span>{d.title}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="primary" size="sm">{d.category}</Badge>
                  </td>
                  <td className="p-4 font-mono text-text-muted">{d.size}</td>
                  <td className="p-4 font-mono">{d.chunks} vectors</td>
                  <td className="p-4">
                    <Badge variant={d.status === 'indexed' ? 'success' : 'warning'} size="sm">
                      {d.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleReindex(d.title)}>
                        <RefreshCw className="w-3.5 h-3.5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id, d.title)}>
                        <Trash2 className="w-3.5 h-3.5 text-danger" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add to KB Modal */}
      <Modal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        title="Add Document to Curated KB"
        description="Upload a new technical paper or textbook to the global knowledge repository."
      >
        <form onSubmit={handleUploadKB} className="space-y-4 pt-2">
          <Input
            label="Document File Title"
            placeholder="e.g. Transformer_Attention_Deep_Dive.pdf"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Select
            label="Assign KB Category"
            options={KB_CATEGORIES.map((c) => ({ value: c, label: c }))}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setUploadModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add to KB</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
