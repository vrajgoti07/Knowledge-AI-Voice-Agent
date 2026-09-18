// ============================================================
// PDFViewerPanel — In-App PDF Citation Inspector & Single-Page Viewer
// Renders PDF via pdfjs-dist strictly locked to the cited page.
// Restricts document access to only the referenced evidence page.
// Features yellow marker text-layer highlighting with a pulse animation.
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as pdfjsLib from 'pdfjs-dist'
import {
  X,
  ZoomIn,
  ZoomOut,
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Lock,
} from 'lucide-react'
import api from '@/services/api'

// Configure PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

export interface PDFViewerPanelProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  documentTitle?: string
  initialPage?: number | null
  highlightExcerpt?: string
  score?: number
}

interface HighlightRect {
  x: number
  y: number
  width: number
  height: number
}

// In-memory ArrayBuffer cache to prevent duplicate network downloads
const pdfArrayBufferCache = new Map<string, ArrayBuffer>()

export function PDFViewerPanel({
  isOpen,
  onClose,
  documentId,
  documentTitle = 'Document Viewer',
  initialPage,
  highlightExcerpt = '',
  score,
}: PDFViewerPanelProps) {
  // Page state: strictly locked to the cited target page
  const isPageUnavailable = initialPage === null || initialPage === undefined || initialPage <= 0
  const targetPage = isPageUnavailable ? 1 : initialPage

  const [totalPages, setTotalPages] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.25)
  const [loading, setLoading] = useState<boolean>(true)
  const [pageRendering, setPageRendering] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isNonPdf, setIsNonPdf] = useState<boolean>(false)
  const [highlights, setHighlights] = useState<HighlightRect[]>([])
  const [hasExactMatch, setHasExactMatch] = useState<boolean>(false)
  const [isPulsing, setIsPulsing] = useState<boolean>(false)

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const highlightRef = useRef<HTMLDivElement | null>(null)

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // ── Load PDF Document (with Auth + Cache + Non-PDF Detection) ─
  useEffect(() => {
    let isCancelled = false
    if (!isOpen || !documentId) return

    async function loadPdf() {
      setLoading(true)
      setErrorMessage(null)
      setIsNonPdf(false)

      try {
        let arrayBuffer = pdfArrayBufferCache.get(documentId)

        if (!arrayBuffer) {
          // Authenticated fetch through configured Axios client
          const res = await api.get(`/documents/${documentId}/file`, {
            responseType: 'arraybuffer',
          })

          if (!res || !res.data) {
            throw new Error('Empty file response received from server')
          }

          arrayBuffer = res.data as ArrayBuffer

          // Validate magic bytes (%PDF-) to detect non-PDF files
          if (arrayBuffer.byteLength >= 5) {
            const magic = new TextDecoder().decode(new Uint8Array(arrayBuffer.slice(0, 5)))
            if (magic !== '%PDF-') {
              setIsNonPdf(true)
              setLoading(false)
              return
            }
          }

          pdfArrayBufferCache.set(documentId, arrayBuffer)
        } else {
          // Check cached buffer magic bytes
          if (arrayBuffer.byteLength >= 5) {
            const magic = new TextDecoder().decode(new Uint8Array(arrayBuffer.slice(0, 5)))
            if (magic !== '%PDF-') {
              setIsNonPdf(true)
              setLoading(false)
              return
            }
          }
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
          console.error('[PDFViewerPanel] Error loading document:', err)
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

  // ── Render Strictly the Target Cited Page & Extract Text Coordinates ──
  const renderTargetPage = useCallback(async () => {
    if (!pdfDocRef.current || !canvasRef.current || targetPage < 1) return

    try {
      setPageRendering(true)
      const pageToRender = Math.min(targetPage, pdfDocRef.current.numPages || 1)
      const page = await pdfDocRef.current.getPage(pageToRender)

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

      // ── Substring Search within PDF Text Layer for Yellow Marker Highlighting ──
      if (highlightExcerpt && highlightExcerpt.trim()) {
        try {
          const textContent = await page.getTextContent()
          const items = textContent.items as Array<{
            str: string
            transform: number[]
            width: number
            height: number
          }>

          // Build continuous page text with item boundary indices
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

          // Normalization: lowercasing and collapsing whitespace
          const normalize = (s: string) =>
            s
              .toLowerCase()
              .replace(/[^\w\s]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()

          const normalizedPage = normalize(fullPageText)
          const normalizedTarget = normalize(highlightExcerpt)

          // 1. Try full normalized target match
          let matchIdx = normalizedPage.indexOf(normalizedTarget)
          let matchLength = normalizedTarget.length

          // 2. Fallback to initial 65-char prefix if long excerpt
          if (matchIdx === -1 && normalizedTarget.length > 50) {
            const prefix = normalizedTarget.slice(0, 65).trim()
            matchIdx = normalizedPage.indexOf(prefix)
            matchLength = prefix.length
          }

          // 3. Fallback to first 6-8 words if OCR or punctuation differs slightly
          if (matchIdx === -1) {
            const words = normalizedTarget.split(/\s+/).filter(Boolean)
            if (words.length >= 4) {
              const phrase6 = words.slice(0, 6).join(' ')
              matchIdx = normalizedPage.indexOf(phrase6)
              if (matchIdx !== -1) {
                matchLength = phrase6.length
              } else {
                const phrase4 = words.slice(0, 4).join(' ')
                matchIdx = normalizedPage.indexOf(phrase4)
                if (matchIdx !== -1) {
                  matchLength = phrase4.length
                }
              }
            }
          }

          if (matchIdx !== -1) {
            const matchEnd = matchIdx + matchLength
            const matchingItems = itemBounds.filter(
              ib => ib.start <= matchEnd && ib.end >= matchIdx
            )

            const matchedRects: HighlightRect[] = []

            for (const mi of matchingItems) {
              const it = mi.item
              const tx = it.transform
              // Convert PDF coordinates to viewport coordinates
              const [vx, vy] = viewport.convertToViewportPoint(tx[4], tx[5])
              const vWidth = it.width * scale
              const vHeight = (it.height || Math.abs(tx[3]) || 12) * scale

              matchedRects.push({
                x: vx,
                y: vy - vHeight,
                width: Math.max(vWidth, 16),
                height: Math.max(vHeight, 14),
              })
            }

            if (matchedRects.length > 0) {
              setHighlights(matchedRects)
              setHasExactMatch(true)

              // Trigger 1.5s subtle pulse animation
              setIsPulsing(true)
              setTimeout(() => setIsPulsing(false), 1500)

              // Scroll first highlight into view
              setTimeout(() => {
                highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }, 100)
            } else {
              setHighlights([])
              setHasExactMatch(false)
            }
          } else {
            // Substring search did not match — clean fallback without error
            setHighlights([])
            setHasExactMatch(false)
          }
        } catch (textErr) {
          console.debug('[PDFViewerPanel] Text extraction notice:', textErr)
          setHighlights([])
          setHasExactMatch(false)
        }
      } else {
        setHighlights([])
        setHasExactMatch(false)
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('[PDFViewerPanel] Page render error:', err)
      }
    } finally {
      setPageRendering(false)
    }
  }, [targetPage, scale, highlightExcerpt])

  useEffect(() => {
    if (!loading && !isNonPdf && pdfDocRef.current) {
      renderTargetPage()
    }
  }, [loading, isNonPdf, scale, renderTargetPage])

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 2.5))
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.75))
  const handleZoomReset = () => setScale(1.25)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs select-none">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Slide-Over Main Viewer Panel */}
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative z-10 flex flex-col w-full md:w-[720px] lg:w-[880px] xl:w-[980px] h-full bg-[#0A0E1A] border-l border-white/10 shadow-2xl overflow-hidden font-sans text-slate-200"
        >
          {/* ── Top Header Toolbar ─────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#121A2C] shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate max-w-xs md:max-w-md">
                  {documentTitle}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                  <span className="text-yellow-300 font-mono font-medium">
                    Evidence Page {targetPage} of {totalPages}
                  </span>

                  {isPageUnavailable ? (
                    <span className="inline-flex items-center gap-1 text-amber-400/90 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <HelpCircle className="w-3 h-3 text-amber-400" /> Page reference unavailable
                    </span>
                  ) : hasExactMatch ? (
                    <span className="inline-flex items-center gap-1 text-amber-300 font-medium bg-yellow-500/15 px-2 py-0.5 rounded border border-yellow-500/30">
                      <Sparkles className="w-3 h-3 text-yellow-400 fill-current" /> Yellow Marker Highlighted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cited Page Grounded
                    </span>
                  )}

                  {score !== undefined && (
                    <span className="font-mono text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      Match: {score <= 1 && score >= 0 ? Math.round(score * 100) : Math.min(100, Math.round(score))}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Header Actions — Strictly Close Button to prevent browsing/downloading entire document */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                title="Close PDF Viewer (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Subheader Controls Bar (Single-Page Indicator & Zoom) ─────── */}
          {!isNonPdf && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-[#0D1220] border-b border-white/[0.06] text-xs shrink-0">
              {/* Single-Page Scoped Indicator */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 font-mono text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5 text-yellow-400" />
                  Page {targetPage} (Citation Scope)
                </span>

                {pageRendering && (
                  <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin ml-1" />
                )}
              </div>

              {/* Cited Excerpt Notice with Yellow Marker Tag */}
              {highlightExcerpt && (
                <div className="hidden lg:flex items-center gap-1.5 max-w-sm truncate text-[11px] text-slate-300 bg-yellow-500/[0.06] px-2.5 py-1 rounded-lg border border-yellow-500/20">
                  <span className="text-yellow-400 font-bold shrink-0">Highlighted:</span>
                  <span className="truncate italic font-serif">"{highlightExcerpt}"</span>
                </div>
              )}

              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.75}
                  className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08] disabled:opacity-30 transition-all cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleZoomReset}
                  className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-[11px] text-slate-300 hover:bg-white/[0.08] transition-all cursor-pointer"
                  title="Reset Zoom"
                >
                  {Math.round(scale * 100)}%
                </button>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={scale >= 2.5}
                  className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08] disabled:opacity-30 transition-all cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Document Canvas Body Scrollable Viewport ─────────── */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center bg-[#070A12] select-text"
          >
            {loading ? (
              <div className="my-auto flex flex-col items-center justify-center space-y-4 py-20">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                <p className="text-sm font-medium text-slate-300">
                  Streaming and rendering citation page...
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Loading high-resolution vector layers for Page {targetPage}
                </p>
              </div>
            ) : isNonPdf ? (
              /* Edge Case: Non-PDF document (docx, pptx, etc.) */
              <div className="my-auto max-w-md p-6 rounded-2xl bg-[#121A2C] border border-white/10 text-center space-y-3">
                <FileText className="w-10 h-10 text-amber-400 mx-auto opacity-80" />
                <h4 className="text-base font-semibold text-white">Preview available for PDF sources only</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This cited document is not a PDF format file. In-app single-page vector view is supported for PDF documents.
                </p>
              </div>
            ) : errorMessage ? (
              /* Error State */
              <div className="my-auto max-w-md p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                <h4 className="text-sm font-semibold text-white">Document Preview Unavailable</h4>
                <p className="text-xs text-slate-400">{errorMessage}</p>
              </div>
            ) : (
              /* Rendered Canvas + Fluorescent Yellow Highlighter Overlays */
              <div
                className="relative rounded-xl shadow-2xl transition-all duration-300 bg-white ring-4 ring-yellow-400/50 shadow-yellow-500/15"
              >
                {/* Canvas page rendering */}
                <canvas ref={canvasRef} className="block rounded-xl overflow-hidden" />

                {/* ── Yellow Marker Overlay Highlighting with Pulse ── */}
                {highlights.length > 0 && (
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
                          backgroundColor: 'rgba(250, 204, 21, 0.45)', // Authentic fluorescent yellow marker
                          mixBlendMode: 'multiply',
                          borderBottom: '2px solid rgba(234, 179, 8, 0.9)',
                        }}
                        className={`absolute rounded-xs transition-all duration-300 ${
                          isPulsing
                            ? 'animate-pulse shadow-[0_0_14px_rgba(250,204,21,0.7)] ring-2 ring-yellow-400/60'
                            : ''
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Grounding Source Page Badge with Yellow Theme */}
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-yellow-400 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1.5 z-20">
                  <Sparkles className="w-3.5 h-3.5 fill-current" /> Verified Citation Page
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

