// ============================================================
// MultiDocPickerModal — Multi-Document Context Selector Modal
// Allows selecting multiple indexed documents with search,
// select-all/clear shortcuts, and live selection counters.
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  Layers,
  FileText,
  CheckSquare,
  Square,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { apiGet } from '@/services/api'

export interface ContextDoc {
  id: string
  title: string
  fileType: string
  chunks: number
  status: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  selectedDocs: ContextDoc[]
  onApply: (docs: ContextDoc[]) => void
}

export function MultiDocPickerModal({ isOpen, onClose, selectedDocs, onApply }: Props) {
  const [docs, setDocs] = useState<ContextDoc[]>([])
  const [selectedMap, setSelectedMap] = useState<Map<string, ContextDoc>>(new Map())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // Initialize selected map when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialMap = new Map<string, ContextDoc>()
      selectedDocs.forEach(d => initialMap.set(d.id, d))
      setSelectedMap(initialMap)
      fetchDocs()
    }
  }, [isOpen, selectedDocs])

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const all = await apiGet<ContextDoc[]>('/documents?scope=all')
      setDocs(all.filter(d => (d.status || '').toLowerCase() === 'ready'))
    } catch {
      /* non-critical */
    } finally {
      setLoading(false)
    }
  }

  const filteredDocs = docs.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase().trim())
  )

  const toggleSelect = (doc: ContextDoc) => {
    setSelectedMap(prev => {
      const next = new Map(prev)
      if (next.has(doc.id)) {
        next.delete(doc.id)
      } else {
        next.set(doc.id, doc)
      }
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelectedMap(prev => {
      const next = new Map(prev)
      filteredDocs.forEach(d => next.set(d.id, d))
      return next
    })
  }

  const deselectAll = () => {
    setSelectedMap(new Map())
  }

  const handleApply = () => {
    const selectedList = Array.from(selectedMap.values())
    onApply(selectedList)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-xl bg-[#101726] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/[0.08] flex items-start justify-between bg-gradient-to-r from-sky-500/10 via-transparent to-transparent shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Select Context Documents</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Multi-Doc RAG
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select 2 or more documents to compare, synthesize, and cite across topics.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Selection Controls Bar */}
          <div className="p-4 border-b border-white/[0.06] bg-[#0c121e] space-y-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#070b14] border border-white/10 focus-within:border-sky-500/50 transition-colors">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search documents by title..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-slate-500 hover:text-white text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-sky-400 hover:text-sky-300 font-medium cursor-pointer transition-colors px-1"
                >
                  Select All
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-slate-400 hover:text-slate-200 font-medium cursor-pointer transition-colors px-1"
                >
                  Deselect All
                </button>
              </div>

              <span className="text-slate-400 font-mono text-[11px]">
                <strong className="text-sky-400">{selectedMap.size}</strong> of {filteredDocs.length} selected
              </span>
            </div>
          </div>

          {/* Scrollable Document List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">
                  {search ? 'No documents match your search' : 'No ready documents available'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload PDF or Word documents from the Documents page to index them for multi-document chat.
                </p>
              </div>
            ) : (
              filteredDocs.map(doc => {
                const isSelected = selectedMap.has(doc.id)
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleSelect(doc)}
                    className={`group flex items-center gap-3.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-500/40 text-white shadow-xs'
                        : 'bg-[#0a0f1c] border-white/5 hover:border-white/20 text-slate-300 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="shrink-0 text-sky-400">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-sky-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-500 group-hover:text-slate-400" />
                      )}
                    </div>

                    <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />

                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span className="uppercase">{doc.fileType || 'PDF'}</span>
                        <span>•</span>
                        <span>{doc.chunks} chunks</span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        In Scope
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-white/[0.08] bg-[#0c121e] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {selectedMap.size === 0
                  ? 'Use Entire Library'
                  : `Chat with ${selectedMap.size} ${selectedMap.size === 1 ? 'Document' : 'Documents'}`}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
