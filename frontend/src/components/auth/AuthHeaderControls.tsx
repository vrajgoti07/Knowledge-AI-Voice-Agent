// ============================================================
// AuthHeaderControls — Global Glassmorphic Top Controls
// Features:
// 1. Top-Left Glassmorphic "← Back" button with hover translation & cyan neon glow.
// 2. Top-Right "Acoustic Core: Online" live pulsating status badge.
// Colors: Uses unified design tokens from index.css @theme.
// ============================================================

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Radio } from 'lucide-react'
import { ROUTES } from '@/constants'
import { cn } from '@/utils'

interface AuthHeaderControlsProps {
  backTo?: string
  backLabel?: string
  className?: string
}

export function AuthHeaderControls({
  backTo = '/',
  backLabel = 'Back',
  className,
}: AuthHeaderControlsProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backTo) {
      navigate(backTo)
    } else {
      navigate(-1)
    }
  }

  return (
    <div
      className={cn(
        'absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 sm:p-6 pointer-events-auto select-none',
        className
      )}
    >
      {/* ── TOP-LEFT GLASSMORPHIC BACK BUTTON ─────────────────────────── */}
      <motion.button
        type="button"
        onClick={handleBack}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#050811]/60 hover:bg-[#080E1C]/80 backdrop-blur-md border border-slate-700/60 hover:border-accent-primary/60 text-slate-300 hover:text-white text-xs font-medium transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] active:scale-95"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-accent-light transition-transform duration-200 group-hover:-translate-x-1" />
        <span className="tracking-wide">{backLabel}</span>
      </motion.button>

      {/* ── TOP-RIGHT LIVE STATUS INDICATOR ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#050811]/60 backdrop-blur-md border border-slate-700/60 text-xs font-mono text-slate-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
        </span>
        <span className="text-[11px] font-semibold text-slate-200 tracking-wider">
          Acoustic Core: <span className="text-success font-bold">Online</span>
        </span>
      </motion.div>
    </div>
  )
}
