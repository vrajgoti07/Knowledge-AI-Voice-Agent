// ============================================================
// ContextFilePanel — Micro-Header Inspector Sidebar
// Header: text-[10px] tracking-widest text-slate-500 uppercase
// "+ Add Context File": Ghost button with subtle hover transition
// ============================================================
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Plus, FileText, Search, CheckCircle2, FolderOpen, Layers } from 'lucide-react'
import { apiGet } from '@/services/api'

interface ContextDoc {
  id: string
  title: string
  fileType: string
  chunks: number
  status: string
}

import { MultiDocPickerModal } from './MultiDocPickerModal'

interface Props {
  contextFiles: ContextDoc[]
  onAdd: (doc: ContextDoc) => void
  onRemove: (id: string) => void
  onUpdateContext?: (docs: ContextDoc[]) => void
  isOpen?: boolean
  onClose?: () => void
}

export function ContextFilePanel({ contextFiles, onAdd, onRemove, onUpdateContext, isOpen = true, onClose }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const panelContent = (
    <div className="flex flex-col h-full bg-[#121A2C]">
      {/* Inspector Micro-Header */}
      <div className="h-12 px-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[10px] tracking-widest text-slate-500 uppercase font-semibold">
            Context Files
          </span>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close context panel" className="text-slate-400 hover:text-white cursor-pointer lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Property inspector list or empty state */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {contextFiles.length === 0 ? (
          <div className="text-center py-10 space-y-3 my-auto">
            <div className="w-10 h-10 rounded-xl bg-[#0A0E1A] border border-white/5 flex items-center justify-center text-slate-500 mx-auto">
              <FolderOpen className="w-5 h-5 opacity-60" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">No context file selected</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">RAG search queries entire library</p>
            </div>
          </div>
        ) : (
          contextFiles.map(doc => (
            <div
              key={doc.id}
              className="group flex items-start gap-2.5 p-3 rounded-xl bg-[#0A0E1A] border border-white/5 hover:border-sky-500/30 transition-all"
            >
              <FileText className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-semibold text-white truncate" title={doc.title}>{doc.title}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{doc.chunks} chunks</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-success/10 text-success border border-success/20 font-medium">
                    Active
                  </span>
                </div>
              </div>
              <button
                type="button"
                aria-label={`Remove ${doc.title} from context`}
                onClick={() => onRemove(doc.id)}
                className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer shrink-0 p-1 opacity-60 group-hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Ghost "+ Add Context File" button */}
      <div className="p-4 border-t border-white/[0.06] bg-[#121A2C] shrink-0">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-sky-500/40 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-sky-400" />
          <span>+ Add Context File</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop IDE Inspector right sidebar */}
      <div className="hidden lg:flex w-[280px] shrink-0 h-full bg-[#121A2C] border-l border-white/[0.06] flex-col">
        {panelContent}
      </div>

      {/* Mobile slide-over drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed right-0 top-0 bottom-0 w-72 bg-[#121A2C] border-l border-white/10 z-50 flex flex-col"
            >
              {panelContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Document picker modal */}
      <MultiDocPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedDocs={contextFiles}
        onApply={(docs) => {
          if (onUpdateContext) {
            onUpdateContext(docs)
          } else {
            docs.forEach(d => onAdd(d))
          }
        }}
      />
    </>
  )
}
