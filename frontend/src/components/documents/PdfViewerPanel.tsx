import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as pdfjsLib from 'pdfjs-dist'
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Sparkles,
  Loader2,
  ExternalLink,
  Download,
  AlertCircle,
  CheckCircle2,
  BookOpen
} from 'lucide-react'
import api, { getAuthToken } from '@/services/api'
import { API_BASE_URL } from '@/constants'

// Configure PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

export interface PdfViewerProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  documentTitle: string
  initialPage?: number
  highlightText?: string
  score?: number
}

interface HighlightRect {
  x: number
  y: number
  width: number
  height: number
}

// In-memory buffer cache across panel opens to eliminate duplicate downloads
const pdfArrayBufferCache = new Map<string, ArrayBuffer>()

export function PdfViewerPanel({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  initialPage = 1,
  highlightText = '',
  score,
}: PdfViewerProps) {
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.25)
  const [loading, setLoading] = useState<boolean>(true)
  const [pageRendering, setPageRendering] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pageInput, setPageInput] = useState<string>(String(initialPage))
  const [highlights, setHighlights] = useState<HighlightRect[]>([])
  const [hasExactMatch, setHasExactMatch] = useState<boolean>(false)

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const highlightRef = useRef<HTMLDivElement | null>(null)

  // Reset initial page when document or citation changes
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(initialPage > 0 ? initialPage : 1)
      setPageInput(String(initialPage > 0 ? initialPage : 1))
    }
  }, [isOpen, initialPage, documentId])

  // Keyboard shortcut listener (Escape to close, arrows for navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        handleNextPage()
      } else if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        handlePrevPage()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentPage, totalPages])

// ── Load PDF Document (with Cache) ─────────────────────────
  useEffect(() => {
    let isCancelled = false
    if (!isOpen || !documentId) return

    async function loadPdf() {
      setLoading(true)
      setErrorMessage(null)

      try {
        let arrayBuffer = pdfArrayBufferCache.get(documentId)

        if (!arrayBuffer) {
          // Fetch raw PDF bytes through authenticated api instance
          const res = await api.get(`/documents/${documentId}/file`, {
            responseType: 'arraybuffer',
          })

          if (!res || !res.data) {
            throw new Error('Empty file response received from server')
          }

          arrayBuffer = res.data as ArrayBuffer
          pdfArrayBufferCache.set(documentId, arrayBuffer)
        }

        if (isCancelled) return

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        })

        const pdfDoc = await loadingTask.promise
        if (isCancelled) return

        pdfDocRef.current = pdfDoc
        setTotalPages(pdfDoc.numPages)
        setLoading(false)
      } catch (err: any) {
        if (!isCancelled) {
          console.error('[PdfViewer] Error loading document:', err)
          setErrorMessage(err.message || 'Could not load the PDF document file.')
          setLoading(false)
        }
      }
    }

    loadPdf()

    return () => {
      isCancelled = true
    }
  }, [isOpen, documentId])

  // ── Render Active Page onto Canvas & Extract Text Coordinates ──────────────────
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDocRef.current || !canvasRef.current || currentPage < 1) return

    try {
      setPageRendering(true)
      const page = await pdfDocRef.current.getPage(currentPage)

      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {
          /* ignore cancel exception */
        }
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const pixelRatio = window.devicePixelRatio || 1
      const viewport = page.getViewport({ scale })

      canvas.width = viewport.width * pixelRatio
      canvas.height = viewport.height * pixelRatio
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      }

      const renderTask = page.render(renderContext)
      renderTaskRef.current = renderTask
      await renderTask.promise

      // ── Tier 2: Precise Text Highlighting Calculation ──────────────
      if (highlightText && highlightText.trim()) {
        try {
          const textContent = await page.getTextContent()
          const items = textContent.items as Array<{
            str: string
            transform: number[]
            width: number
            height: number
          }>

          // Clean and normalize target snippet
          const targetClean = highlightText
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()

          // Take distinctive phrases (first 50-80 chars) for robust matching
          const searchSnippet = targetClean.slice(0, 75).trim()

          let matchedRects: HighlightRect[] = []
          let fullPageText = ''
          const itemBounds: Array<{ start: number; end: number; item: typeof items[0] }> = []

          for (const it of items) {
            if (!it.str) continue
            const startIdx = fullPageText.length
            fullPageText += it.str + ' '
            itemBounds.push({
              start: startIdx,
              end: fullPageText.length,
              item: it,
            })
          }

          const normalizedPageText = fullPageText
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')

          const matchIdx = normalizedPageText.indexOf(searchSnippet)

          if (matchIdx !== -1) {
            const matchEnd = matchIdx + searchSnippet.length
            const matchingItems = itemBounds.filter(
              ib => ib.start <= matchEnd && ib.end >= matchIdx
            )

            for (const mi of matchingItems) {
              const it = mi.item
              const tx = it.transform
              // Convert PDF coordinates to viewport pixels
              const pX = tx[4]
              const pY = tx[5]

              // PDF coordinate matrix conversion to canvas viewport
              const [vx, vy] = viewport.convertToViewportPoint(pX, pY)
              const vWidth = it.width * scale
              const vHeight = (it.height || Math.abs(tx[3]) || 12) * scale

              matchedRects.push({
                x: vx,
                y: vy - vHeight,
                width: Math.max(vWidth, 20),
                height: Math.max(vHeight, 14),
              })
            }

            if (matchedRects.length > 0) {
              setHighlights(matchedRects)
              setHasExactMatch(true)
            } else {
              setHighlights([])
              setHasExactMatch(false)
            }
          } else {
            setHighlights([])
            setHasExactMatch(false)
          }
        } catch (textErr) {
          console.debug('[PdfViewer] Text coordinate match notice:', textErr)
          setHighlights([])
          setHasExactMatch(false)
        }
      } else {
        setHighlights([])
        setHasExactMatch(false)
      }

      setPageRendering(false)
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('[PdfViewer] Page render error:', err)
        setPageRendering(false)
      }
    }
  }, [currentPage, scale, highlightText])

  useEffect(() => {
    if (!loading && pdfDocRef.current) {
      renderCurrentPage()
    }
  }, [loading, currentPage, scale, renderCurrentPage])

  // Navigation handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const p = currentPage - 1
      setCurrentPage(p)
      setPageInput(String(p))
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const p = currentPage + 1
      setCurrentPage(p)
      setPageInput(String(p))
    }
  }

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value)
  }

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(pageInput, 10)
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      setCurrentPage(num)
    } else {
      setPageInput(String(currentPage))
    }
  }

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 2.5))
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.75))
  const handleZoomReset = () => setScale(1.25)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Slide-Over Main Viewer Panel */}
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative z-10 flex flex-col w-full md:w-[720px] lg:w-[880px] xl:w-[980px] h-full bg-[#0b0f19] border-l border-white/10 shadow-2xl overflow-hidden"
        >
          {/* ── Top Header Toolbar ─────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0f172a]/95 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate max-w-xs md:max-w-md">
                  {documentTitle || 'Document Viewer'}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="text-sky-300 font-mono">Page {currentPage} of {totalPages}</span>
                  {hasExactMatch ? (
                    <span className="inline-flex items-center gap-1 text-success font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Exact Excerpt Highlighted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-400/90">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Source Page Grounded
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-2">
              <a
                href={`${API_BASE_URL}/documents/${documentId}/file${getAuthToken() ? `?token=${encodeURIComponent(getAuthToken()!)}` : ''}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Open in new browser tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                title="Close PDF Viewer (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Subheader Controls Bar (Navigation & Zoom) ─────── */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-[#090d16] border-b border-white/[0.06] text-xs">
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={handlePrevPage}
                className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  className="w-12 px-2 py-1 text-center font-mono font-bold text-white bg-slate-900 border border-sky-500/30 rounded-lg text-xs focus:outline-hidden focus:border-sky-400"
                />
                <span className="text-slate-500">/ {totalPages}</span>
              </form>

              <button
                type="button"
                disabled={currentPage >= totalPages || loading}
                onClick={handleNextPage}
                className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Cited Excerpt Notice Pill */}
            {highlightText && (
              <div className="hidden lg:flex items-center gap-1.5 max-w-sm truncate text-[11px] text-slate-400 bg-white/[0.02] px-2.5 py-1 rounded-lg border border-white/[0.04]">
                <span className="text-sky-400 font-semibold shrink-0">Cited:</span>
                <span className="truncate italic">"{highlightText}"</span>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 0.75}
                className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08] disabled:opacity-30 transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleZoomReset}
                className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-[11px] text-slate-300 hover:bg-white/[0.08] transition-all"
                title="Reset Zoom"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 2.5}
                className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08] disabled:opacity-30 transition-all"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Document Canvas Body Scrollable Viewport ─────────── */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center bg-[#070a12] select-text"
          >
            {loading ? (
              <div className="my-auto flex flex-col items-center justify-center space-y-4 py-20">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="text-sm font-medium text-slate-300">
                  Streaming and rendering document...
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Loading high-resolution vector layers
                </p>
              </div>
            ) : errorMessage ? (
              <div className="my-auto max-w-md p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                <h4 className="text-sm font-semibold text-white">Document Preview Unavailable</h4>
                <p className="text-xs text-slate-400">{errorMessage}</p>
                <a
                  href={`${API_BASE_URL}/documents/${documentId}/file${getAuthToken() ? `?token=${encodeURIComponent(getAuthToken()!)}` : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Original File
                </a>
              </div>
            ) : (
              /* Rendered Canvas + Tier 1 Outline + Tier 2 Highlighter Boxes */
              <div
                className={`relative rounded-xl shadow-2xl transition-all duration-300 bg-white ${
                  currentPage === initialPage
                    ? 'ring-4 ring-sky-400/80 shadow-sky-500/20 shadow-2xl'
                    : 'border border-white/20'
                }`}
              >
                {/* Canvas page rendering */}
                <canvas ref={canvasRef} className="block rounded-xl overflow-hidden" />

                {/* Page rendering overlay spinner for smooth page flips */}
                {pageRendering && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                    <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
                  </div>
                )}

                {/* ── Tier 2: Real Highlighter Bounding Boxes ─────────── */}
                {currentPage === initialPage && highlights.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
                    {highlights.map((rect, idx) => (
                      <div
                        key={idx}
                        ref={idx === 0 ? highlightRef : null}
                        style={{
                          left: `${rect.x}px`,
                          top: `${rect.y}px`,
                          width: `${rect.width}px`,
                          height: `${rect.height}px`,
                        }}
                        className="absolute bg-yellow-300/40 border-b-2 border-yellow-500/80 shadow-sm mix-blend-multiply animate-pulse"
                      />
                    ))}
                  </div>
                )}

                {/* Tier 1 Page Badge */}
                {currentPage === initialPage && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-sky-500 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1.5 z-20">
                    <Sparkles className="w-3.5 h-3.5" /> Cited Source Page
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
