// ============================================================
// CitationBadges — Clean Tooltip Citation Helper
// Renders subtle inline superscripts [1] with excerpt tooltip on hover/click.
// Eradicates bulky source accordion blocks from the chat feed.
// ============================================================
import { useState } from 'react'

export interface Citation {
  id: string
  documentId: string
  documentTitle: string
  excerpt: string
  page?: number
  chunk?: number
  score?: number
}

interface InlineCitationProps {
  num: number
  citation?: Citation
}

export function InlineCitationChip({ num, citation }: InlineCitationProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <span className="relative inline-block">
      <sup
        onClick={() => setShowTooltip(v => !v)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-sky-400 hover:text-sky-300 font-mono text-[11px] align-super px-0.5 cursor-pointer select-none transition-colors"
      >
        [{num}]
      </sup>

      {showTooltip && citation && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl bg-slate-900 border border-white/10 shadow-2xl z-50 text-left space-y-1 font-sans">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="truncate">{citation.documentTitle}</span>
            {citation.page && <span className="text-[10px] font-mono text-slate-400">p.{citation.page}</span>}
          </div>
          <p className="text-[11px] text-slate-300 italic leading-relaxed line-clamp-3 bg-white/[0.03] p-2 rounded-lg">
            "{citation.excerpt}"
          </p>
        </div>
      )}
    </span>
  )
}
