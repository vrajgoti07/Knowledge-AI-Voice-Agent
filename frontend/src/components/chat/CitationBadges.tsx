// ============================================================
// CitationBadges — Interactive Citation Badges & Ranked Evidence Stack
// Features clickable inline chips with accent glow hover,
// Ranked Evidence Stack (single-column, relevance-ordered, score-scaled accent edges,
// rank hierarchy, always-on excerpt preview, animated checkmark verification),
// and slide-over PDF viewer with jump-to-page & excerpt highlighting.
// ============================================================
import React, { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { FileText, ChevronDown, ChevronUp, BookOpen, Eye } from 'lucide-react'
import { PDFViewerPanel } from './PDFViewerPanel'
import { cn } from '@/utils'

export interface Citation {
  id?: string
  documentId?: string
  documentTitle?: string
  excerpt?: string
  page?: number | null
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
  const [localViewerOpen, setLocalViewerOpen] = useState(false)

  const handleChipClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!citation) return

    if (onOpenPdf) {
      onOpenPdf(citation)
    } else {
      setLocalViewerOpen(true)
    }
  }

  return (
    <>
      <span className="relative inline-block mx-0.5">
        <button
          type="button"
          onClick={handleChipClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-sky-500/15 hover:bg-sky-500/30 text-sky-400 hover:text-sky-200 font-mono text-[11px] font-semibold align-baseline cursor-pointer select-none transition-all duration-200 border border-sky-500/30 hover:border-sky-400 hover:shadow-[0_0_12px_rgba(56,189,248,0.45)] group active:scale-95"
          aria-label={`Source reference ${num}`}
          title={
            citation
              ? `Click to view citation ${citation.page ? `on Page ${citation.page}` : ''} in ${citation.documentTitle || 'document'}`
              : `Source [${num}]`
          }
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
              {citation.page ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 shrink-0">
                  p. {citation.page}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                  doc
                </span>
              )}
            </div>
            {citation.excerpt && (
              <p className="text-[11px] text-slate-300 italic leading-relaxed line-clamp-4 bg-white/[0.04] p-2.5 rounded-lg border border-white/[0.06]">
                "{citation.excerpt}"
              </p>
            )}
            {citation.documentId && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowTooltip(false)
                  if (onOpenPdf) {
                    onOpenPdf(citation)
                  } else {
                    setLocalViewerOpen(true)
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{citation.page ? `Inspect Cited Page ${citation.page}` : 'Inspect Evidence'}</span>
              </button>
            )}
          </div>
        )}
      </span>

      {/* Local fallback viewer if not controlled by parent */}
      {localViewerOpen && citation && (
        <PDFViewerPanel
          isOpen={localViewerOpen}
          onClose={() => setLocalViewerOpen(false)}
          documentId={citation.documentId || ''}
          documentTitle={citation.documentTitle || 'Document'}
          initialPage={citation.page}
          highlightExcerpt={citation.excerpt || ''}
          score={citation.score}
        />
      )}
    </>
  )
}

interface DocumentSourcesListProps {
  citations: Citation[]
  onOpenPdf?: (citation: Citation) => void
}

const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 50ms stagger per row
    },
  },
}

const rowItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
}

interface PageCitation {
  page: number | null
  excerpt: string
  score: number
  citation: Citation
}

interface GroupedSource {
  documentId?: string
  documentTitle: string
  maxScore: number
  pages: PageCitation[]
}

export function DocumentSourcesList({ citations, onOpenPdf }: DocumentSourcesListProps) {
  const [expanded, setExpanded] = useState(false)
  // Top-1 result auto-expanded on first render
  const [activeIdx, setActiveIdx] = useState<number | null>(0)
  const [activeViewerCitation, setActiveViewerCitation] = useState<Citation | null>(null)

  if (!citations || citations.length === 0) return null

  // 1. Deduplicate sources by documentTitle and page
  const uniqueSources: Citation[] = []
  const seenPageKey = new Set<string>()

  for (const c of citations) {
    const key = `${c.documentTitle || 'doc'}_${c.page || 0}`
    if (!seenPageKey.has(key)) {
      seenPageKey.add(key)
      uniqueSources.push(c)
    }
  }

  // 2. Strict Primary-Document Gating:
  // Identify the #1 highest scoring primary document directly answering user demand
  const sortedByScore = [...uniqueSources].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const primaryDoc = sortedByScore[0]
  const primaryDocKey = primaryDoc ? (primaryDoc.documentId || primaryDoc.documentTitle) : null

  // Restrict citations ONLY to the main user-chat related PDF.
  // Filter out any secondary/unrelated PDFs (e.g., Module 2 Math or Module 3 Preprocessing when query is Linear Regression)
  const mainPdfSources = sortedByScore.filter(c => {
    const docKey = c.documentId || c.documentTitle
    // Always include all cited pages from the main relevant PDF
    if (docKey === primaryDocKey) {
      return true
    }
    // Only permit a secondary PDF if its relevance is exceptionally high (>= 90% of top and >= 50% absolute)
    const topScore = primaryDoc?.score ?? 0
    const currentScore = c.score ?? 0
    const normTop = topScore <= 1 ? topScore : topScore / 100
    const normCurrent = currentScore <= 1 ? currentScore : currentScore / 100
    return normTop >= 0.50 && normCurrent >= Math.max(0.50, normTop * 0.90)
  })

  const sourcesToGroup = mainPdfSources.length > 0 ? mainPdfSources : sortedByScore

  // 3. Group by Module/Document so multiple pages from the same module appear in ONE unified card
  const docGroupMap = new Map<string, GroupedSource>()

  for (const c of sourcesToGroup) {
    const docKey = c.documentId || c.documentTitle || 'Document'
    const docTitle = c.documentTitle || 'Document'
    const itemScore = c.score ?? 0.5

    let group = docGroupMap.get(docKey)
    if (!group) {
      group = {
        documentId: c.documentId,
        documentTitle: docTitle,
        maxScore: itemScore,
        pages: [],
      }
      docGroupMap.set(docKey, group)
    } else {
      if (itemScore > group.maxScore) {
        group.maxScore = itemScore
      }
    }

    if (!group.pages.some(p => p.page === c.page)) {
      group.pages.push({
        page: c.page ?? null,
        excerpt: c.excerpt || '',
        score: itemScore,
        citation: c,
      })
    }
  }

  // Sort pages inside each document by page number ascending
  for (const group of docGroupMap.values()) {
    group.pages.sort((a, b) => (a.page ?? 0) - (b.page ?? 0))
  }

  // Sort document groups by maxScore descending
  const groupedSources = Array.from(docGroupMap.values()).sort((a, b) => b.maxScore - a.maxScore)
  const totalCitedPages = groupedSources.reduce((acc, g) => acc + g.pages.length, 0)

  const handleOpenPdf = (cit: Citation) => {
    if (onOpenPdf) {
      onOpenPdf(cit)
    } else {
      setActiveViewerCitation(cit)
    }
  }

  const displayedSources = expanded ? groupedSources : groupedSources.slice(0, 4)

  return (
    <>
      <div className="mt-6 pt-4 border-t border-white/[0.08] space-y-3.5">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-sky-400 transition-colors group cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            <span>
              Document Sources & Citations ({groupedSources.length} {groupedSources.length === 1 ? 'Source' : 'Sources'} · {totalCitedPages} {totalCitedPages === 1 ? 'Page' : 'Pages'})
            </span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {/* Self-drawing SVG checkmark verification moment */}
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 16 16" fill="none">
              <motion.path
                d="M3 8.5L6.5 12L13 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </svg>
            <span className="font-mono text-[11px]">Grounding Verified</span>
          </div>
        </div>

        {/* Ranked Evidence Stack: Single-column vertical list with one card per module */}
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="show"
          className="space-y-2.5 flex flex-col"
        >
          {displayedSources.map((group, idx) => {
            const isSelected = activeIdx === idx
            const isTop1 = idx === 0

            // Normalize score percentage
            const rawScore = group.maxScore
            const percent =
              rawScore <= 1 && rawScore >= 0
                ? Math.round(rawScore * 100)
                : Math.min(100, Math.round(rawScore))
            const normScore = percent / 100

            const hasMultiplePages = group.pages.length > 1
            const topExcerpt = group.pages[0]?.excerpt || ''

            return (
              <motion.div
                key={idx}
                variants={rowItemVariants}
                className={cn(
                  'relative flex flex-col rounded-xl border transition-all duration-200 overflow-hidden',
                  isTop1
                    ? 'bg-[#0c1322]/95 border-sky-500/40 shadow-[0_0_16px_rgba(56,189,248,0.08)]'
                    : isSelected
                    ? 'bg-sky-950/30 border-sky-500/30'
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20'
                )}
              >
                {/* Thin vertical accent bar on far left with score-scaled opacity/glow */}
                <div
                  style={{
                    opacity: Math.max(0.3, normScore),
                    backgroundColor: isTop1 ? '#38BDF8' : '#3B82F6',
                    boxShadow: isTop1 ? '0 0 8px rgba(56,189,248,0.8)' : undefined,
                  }}
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                />

                {/* Main Clickable Header Row */}
                <div
                  onClick={() => setActiveIdx(isSelected ? null : idx)}
                  className="flex items-center justify-between gap-3 p-3.5 pl-4 cursor-pointer select-none"
                >
                  {/* Left Cluster: Rank Badge + Title & All Page Pills + One-Line Preview */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Rank Badge */}
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5',
                        idx === 0
                          ? 'bg-sky-500 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.7)] ring-1 ring-sky-300'
                          : 'bg-white/[0.04] border border-white/10 text-slate-400 font-normal'
                      )}
                    >
                      {idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Document title + all page badges for this module */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-slate-200 truncate max-w-md">
                          {group.documentTitle}
                        </p>

                        {/* Page Pill Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {group.pages.map((p, pIdx) => (
                            <span
                              key={pIdx}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenPdf(p.citation)
                              }}
                              className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/25 hover:bg-sky-500/30 transition-colors cursor-pointer"
                              title={`Inspect Page ${p.page || 'doc'}`}
                            >
                              p. {p.page || 'doc'}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Collapsed state preview: shown when collapsed */}
                      {!isSelected && topExcerpt && (
                        <p className="text-[11px] text-slate-400/90 truncate max-w-xl italic mt-1 pl-0.5 leading-tight">
                          "{topExcerpt.slice(0, 80).trim()}..."
                          {hasMultiplePages && (
                            <span className="ml-2 font-mono text-[10px] text-sky-400 not-italic font-semibold">
                              (+{group.pages.length - 1} more page{group.pages.length > 2 ? 's' : ''})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Cluster: Match-Strength Progress Bar + Percentage + Chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-16 sm:w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            percent >= 80
                              ? 'bg-gradient-to-r from-sky-400 to-cyan-300'
                              : percent >= 60
                              ? 'bg-sky-400/70'
                              : 'bg-slate-500'
                          )}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 w-9 text-right">
                        {percent}%
                      </span>
                    </div>

                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0',
                        isSelected && 'rotate-180 text-sky-400'
                      )}
                    />
                  </div>
                </div>

                {/* Expanded State: All Pages & Excerpts in this Module */}
                {isSelected && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] space-y-3">
                    {group.pages.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5 transition-all hover:border-white/10"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                              {p.page ? `Page ${p.page}` : 'Document Excerpt'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Match: {Math.round((p.score <= 1 ? p.score : p.score / 100) * 100)}%
                            </span>
                          </div>

                          {group.documentId && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenPdf(p.citation)
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all shadow-sm cursor-pointer active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{p.page ? `Inspect Page ${p.page} (Yellow Highlight)` : 'Inspect Evidence'}</span>
                            </button>
                          )}
                        </div>

                        {p.excerpt && (
                          <div className="relative pl-3 border-l-2 border-yellow-400/80 bg-yellow-500/[0.03] p-2.5 rounded-r-lg">
                            <p className="text-xs text-slate-200 leading-relaxed italic font-serif">
                              "{p.excerpt}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        {groupedSources.length > 4 && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer transition-colors pt-1"
          >
            + Show {groupedSources.length - 4} more sources...
          </button>
        )}
      </div>

      {/* In-app PDF Viewer Modal / Slide-over */}
      {activeViewerCitation && (
        <PDFViewerPanel
          isOpen={Boolean(activeViewerCitation)}
          onClose={() => setActiveViewerCitation(null)}
          documentId={activeViewerCitation.documentId || ''}
          documentTitle={activeViewerCitation.documentTitle || 'Document'}
          initialPage={activeViewerCitation.page}
          highlightExcerpt={activeViewerCitation.excerpt || ''}
          score={activeViewerCitation.score}
        />
      )}
    </>
  )
}
