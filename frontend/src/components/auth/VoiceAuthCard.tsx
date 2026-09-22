// ============================================================
// VoiceAuthCard — Glassmorphic Audio AI Agent Auth Card
// Features:
// 1. Semi-transparent dark surface with backdrop-blur-2xl and 1px neon border.
// 2. Integrated 3D VoiceAgentOrb above titles with live typing reaction.
// 3. High-contrast modern typography with cyber tracking.
// 4. Acoustic synthesis clearance state on success.
// Colors: Uses unified design tokens from index.css @theme.
// ============================================================

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { AppLogo } from '@/components/common/AppLogo'
import { APP_NAME } from '@/constants'
import { VoiceAgentOrb } from './VoiceAgentOrb'
import { cn } from '@/utils'

export interface VoiceAuthCardProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  className?: string
  isSuccess?: boolean
  isTyping?: boolean
  isError?: boolean
  successMessage?: string
  onWarpComplete?: () => void
}

export function VoiceAuthCard({
  children,
  title,
  subtitle,
  className,
  isSuccess = false,
  isTyping = false,
  isError = false,
  successMessage = 'Voiceprint Clearance Verified // Synthesizing...',
  onWarpComplete,
}: VoiceAuthCardProps) {
  useEffect(() => {
    if (isSuccess && onWarpComplete) {
      const timer = setTimeout(() => {
        onWarpComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, onWarpComplete])

  return (
    <div className="relative w-full max-w-xl mx-auto z-20 flex items-center justify-center p-2">
      {/* ── MAIN GLASSMORPHIC AUDIO CARD ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={
          isSuccess
            ? {
                scale: 5,
                opacity: 0,
                filter: 'blur(20px)',
                borderColor: 'rgba(0, 242, 254, 1)',
                boxShadow: '0 0 120px rgba(0, 242, 254, 1), 0 0 180px rgba(0, 136, 255, 0.9)',
                transition: {
                  delay: 1.0,
                  duration: 0.55,
                  ease: [0.32, 0, 0.67, 0],
                },
              }
            : {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
              }
        }
        className={cn(
          'w-full bg-[#050811]/75 backdrop-blur-2xl border border-slate-700/50 border-t-accent-light/40 rounded-2xl shadow-[0_0_60px_rgba(59,130,246,0.22)] p-5 sm:p-7 relative overflow-hidden',
          'transition-all duration-300',
          isSuccess && 'border-accent-light shadow-[0_0_90px_rgba(59,130,246,0.8)]',
          className
        )}
      >
        {/* Physical Top Neon Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-light/50 to-transparent" />

        {/* ── SUCCESS SYNTHESIS OVERLAY ────────────────────────────────── */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 z-40 bg-[#050811]/92 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-3"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-2 border-accent-light/30 border-t-accent-light animate-spin" />
                <CheckCircle2 className="w-7 h-7 text-accent-light absolute animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="text-xs sm:text-sm font-mono font-bold text-accent-light tracking-wider flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-light animate-ping" />
                  <span>{successMessage}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 tracking-wide">
                  VOICEPRINT CLEARANCE VERIFIED // CONNECTING NEURAL CORE
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CARD CONTENT ────────────────────────────────────────────── */}
        <motion.div
          animate={{ opacity: isSuccess ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-3.5"
        >
          {/* Top Bar: Brand Identity */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 group-hover:border-accent-primary/50 transition-colors shadow-xs">
                <AppLogo className="w-5 h-5 text-accent-light transition-transform group-hover:scale-105" />
              </div>
              <span className="text-sm sm:text-base font-bold text-white tracking-tight group-hover:text-accent-light transition-colors">
                {APP_NAME}
              </span>
            </Link>
          </div>

          {/* Centered Voice Agent Orb & Spectrum Equalizer */}
          <div className="py-1">
            <VoiceAgentOrb isTyping={isTyping} isSuccess={isSuccess} isError={isError} />
          </div>

          {/* Title & Subtitle */}
          <div className="text-center pt-0.5">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 max-w-md mx-auto">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Children */}
          <div className="space-y-3 pt-1">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
