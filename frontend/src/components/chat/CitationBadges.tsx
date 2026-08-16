// ============================================================
// CitationBadges — Interactive Citation Badges & Document Sources
// Features inline chip popovers, expandable quoted passages,
// and in-app PDF Viewer with Jump-to-Page & Sentence Highlighting.
// ============================================================
import { useState } from 'react'
import { FileText, ExternalLink, ChevronDown, ChevronUp, BookOpen, Layers, Eye, Sparkles } from 'lucide-react'
import { PdfViewerPanel } from '../documents/PdfViewerPanel'

export interface Citation {
  id?: string
  documentId?: string
  documentTitle?: string
  excerpt?: string
  page?: number
  chunk?: number
  score?: number
  url?: string
}

interface InlineCitationProps {
  num: number
  citation?: Citation
  onOpenPdf?: (citation: Citation) => void
}

export function InlineCitationChip({ num, citation, onOpenPdf }: InlineCitationProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <span className="relative inline-block mx-0.5">
      <button
        type="button"
        onClick={() => {
          if (citation) {
            if (onOpenPdf) {
              onOpenPdf(citation)
            } else {
              setShowTooltip(v => !v)
            }
          }
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-md bg-sky-500/10 hover:bg-sky-500/25 text-sky-400 hover:text-sky-300 font-mono text-[11px] font-semibold align-baseline cursor-pointer select-none transition-all border border-sky-500/25 hover:border-sky-400 shadow-xs"
        aria-label={`Source reference ${num}`}
        title={citation ? `Click to jump to Page ${citation.page || 1} in ${citation.documentTitle}` : `Source [${num}]`}
      >
        [{num}]
      </button>

      {showTooltip && citation && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3.5 rounded-xl bg-[#0f172a] border border-sky-500/30 shadow-2xl z-50 text-left space-y-2.5 font-sans backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/10 pb-1.5">
            <div className="flex items-center gap-1.5 truncate">
              <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">{citation.documentTitle || 'Referenced Document'}</span>
            </div>
            {citation.page && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 shrink-0">
                p. {citation.page}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 italic leading-relaxed line-clamp-4 bg-white/[0.04] p-2.5 rounded-lg border border-white/[0.06]">
            "{citation.excerpt}"
          </p>
          {citation.documentId && onOpenPdf && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowTooltip(false)
                onOpenPdf(citation)
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" /> Jump to Page {citation.page || 1}
            </button>
          )}
        </div>
      )}
    </span>
  )
}

interface DocumentSourcesListProps {
  citations: Citation[]
  onOpenPdf?: (citation: Citation) => void
}

export function DocumentSourcesList({ citations, onOpenPdf }: DocumentSourcesListProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [activeViewerCitation, setActiveViewerCitation] = useState<Citation | null>(null)

  if (!citations || citations.length === 0) return null

  // Deduplicate sources by documentTitle and page
  const uniqueSources: Citation[] = []
  const seen = new Set<string>()

  for (const c of citations) {
    const key = `${c.documentTitle || 'doc'}_${c.page || 0}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueSources.push(c)
    }
  }

  const handleOpenPdf = (cit: Citation) => {
    if (onOpenPdf) {
      onOpenPdf(cit)
    } else {
      setActiveViewerCitation(cit)
    }
  }

  return (
    <>
      <div className="mt-6 pt-4 border-t border-white/[0.08] space-y-3">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-sky-400 transition-colors group cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            <span>Document Sources & Citations ({uniqueSources.length})</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          <span className="text-[11px] text-slate-500 font-mono">
            Grounding Verified
          </span>
        </div>

        {/* Source Cards Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {uniqueSources.slice(0, expanded ? uniqueSources.length : 4).map((cit, idx) => {
            const isSelected = activeIdx === idx
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-500/50 shadow-md shadow-sky-500/5'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-sky-500/30'
                }`}
              >
                <div
                  onClick={() => setActiveIdx(isSelected ? null : idx)}
                  className="flex items-start justify-between gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 text-xs font-mono font-bold">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">
                        {cit.documentTitle || 'Document'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        {cit.page && <span className="font-mono text-sky-300">Page {cit.page}</span>}
                        {cit.score && (
                          <span className="text-slate-500">
                            Match: {(cit.score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 mt-1 ${
                      isSelected ? 'rotate-180 text-sky-400' : ''
                    }`}
                  />
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2.5">
                    {cit.excerpt && (
                      <p className="text-[12px] text-slate-300 leading-relaxed bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] italic">
                        "{cit.excerpt}"
                      </p>
                    )}

                    {cit.documentId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenPdf(cit)
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" /> Jump to Page {cit.page || 1} in PDF
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {uniqueSources.length > 4 && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer transition-colors"
          >
            + Show {uniqueSources.length - 4} more sources...
          </button>
        )}
      </div>

      {/* In-app PDF Viewer Modal / Slide-over */}
      {activeViewerCitation && (
        <PdfViewerPanel
          isOpen={Boolean(activeViewerCitation)}
          onClose={() => setActiveViewerCitation(null)}
          documentId={activeViewerCitation.documentId || ''}
          documentTitle={activeViewerCitation.documentTitle || 'Document'}
          initialPage={activeViewerCitation.page || 1}
          highlightText={activeViewerCitation.excerpt || ''}
          score={activeViewerCitation.score}
        />
      )}
    </>
  )
}

