// ============================================================
// VideoDemoModal — Interactive Product Demo Overlay Modal
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Sparkles, Check, FileText, Search, Volume2 } from 'lucide-react'
import { backdropVariants, modalVariants } from '@/animations/variants'

export function VideoDemoModal({
  isOpen, onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-bg-primary/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                       w-full max-w-4xl px-4"
          >
            <div className="card-elevated rounded-2xl overflow-hidden border border-border/80 bg-bg-card shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-bg-secondary">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent-blue/20 text-accent-blue flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-sm font-semibold">Khnowlge AI Product Walkthrough</h3>
                    <p className="text-text-muted text-xs">2 Minute Guided Interactive Tour</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="btn-icon btn-ghost w-8 h-8 text-text-muted hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Simulated Interactive Video Screen */}
              <div className="p-8 space-y-6 text-center bg-gradient-to-b from-bg-card to-bg-primary">
                <div className="aspect-video w-full max-w-3xl mx-auto rounded-xl bg-bg-secondary border border-border/80 flex flex-col items-center justify-center p-8 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-dots opacity-30" />
                  <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-accent-green/10 rounded-full blur-2xl" />

                  {/* Play Button Center */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-green to-accent-blue text-bg-primary flex items-center justify-center shadow-glow-green cursor-pointer relative z-10"
                  >
                    <Play className="w-7 h-7 fill-current ml-1" />
                  </motion.div>

                  <p className="text-text-primary font-semibold text-base mt-4 relative z-10">
                    Watch Hybrid RAG In Action
                  </p>
                  <p className="text-text-muted text-xs mt-1 max-w-md relative z-10">
                    See document uploading, sub-second vector search, and citation footnotes rendering live in real time.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
                  <div className="p-3 rounded-lg bg-bg-elevated/60 border border-border/50 space-y-1">
                    <p className="text-accent-green font-mono text-xs font-semibold">1. Upload Documents</p>
                    <p className="text-text-secondary text-xs">PDFs automatically parsed and chunked into vectors.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-elevated/60 border border-border/50 space-y-1">
                    <p className="text-accent-blue font-mono text-xs font-semibold">2. Hybrid Query</p>
                    <p className="text-text-secondary text-xs">BM25 + Dense embeddings search combined.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-elevated/60 border border-border/50 space-y-1">
                    <p className="text-warning font-mono text-xs font-semibold">3. Footnoted Answers</p>
                    <p className="text-text-secondary text-xs">Clickable citations link directly to source text.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
