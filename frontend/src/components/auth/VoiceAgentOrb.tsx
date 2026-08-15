// ============================================================
// VoiceAgentOrb — 3D-Styled Multi-Ring AI Voice Visualizer Orb
// Features:
// 1. 3D-styled multi-ring voice visualizer orb with rotating dashed frequency ring.
// 2. Concentric soundwave pulse rings expanding dynamically during input focus & typing.
// 3. Dynamic 7-bar audio spectrum equalizer dancing in real-time.
// 4. Live status indicator badge: "AI VOICE AGENT // NODE ONLINE".
// Strict Palette: Deep Space Black #050811, Neural Cyan #00F2FE, Electric Blue #0088FF
// ============================================================

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils'

interface VoiceAgentOrbProps {
  isTyping?: boolean
  isSuccess?: boolean
  isError?: boolean
  className?: string
}

export function VoiceAgentOrb({
  isTyping = false,
  isSuccess = false,
  isError = false,
  className,
}: VoiceAgentOrbProps) {
  // Equalizer bar heights based on acoustic state
  const barHeights = isTyping
    ? ['h-5', 'h-7', 'h-4', 'h-8', 'h-6', 'h-7', 'h-4']
    : isSuccess
    ? ['h-6', 'h-6', 'h-6', 'h-6', 'h-6', 'h-6', 'h-6']
    : ['h-2', 'h-4', 'h-6', 'h-3', 'h-5', 'h-3', 'h-2']

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2.5 select-none', className)}>
      {/* ── 1. 3D-STYLED MULTI-RING VOICE ORB ────────────────────────── */}
      <div className="relative flex items-center justify-center w-18 h-18">
        {/* Rotating Outer Dashed Frequency Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: isTyping ? 12 : 25, repeat: Infinity, ease: 'linear' }}
          className={cn(
            'absolute inset-0 rounded-full border border-dashed transition-colors duration-300',
            isError
              ? 'border-red-400/50'
              : isSuccess
              ? 'border-emerald-400/60'
              : 'border-cyan-400/40 shadow-[0_0_20px_rgba(0,242,254,0.25)]'
          )}
        />

        {/* Outer Pulsing Soundwave Ring 1 */}
        <motion.div
          animate={{
            scale: isTyping ? [1, 1.4, 1] : [1, 1.2, 1],
            opacity: isTyping ? [0.4, 0.8, 0.4] : [0.2, 0.45, 0.2],
          }}
          transition={{
            duration: isTyping ? 1.0 : 2.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={cn(
            'absolute inset-1 rounded-full border',
            isError
              ? 'border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              : isSuccess
              ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
              : 'border-cyan-400/60 shadow-[0_0_25px_rgba(0,242,254,0.35)]'
          )}
        />

        {/* Outer Pulsing Soundwave Ring 2 */}
        <motion.div
          animate={{
            scale: isTyping ? [1.1, 1.6, 1.1] : [1.05, 1.35, 1.05],
            opacity: isTyping ? [0.25, 0.65, 0.25] : [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: isTyping ? 1.2 : 2.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.2,
          }}
          className={cn(
            'absolute -inset-1 rounded-full border',
            isError
              ? 'border-red-500/30'
              : isSuccess
              ? 'border-emerald-500/40'
              : 'border-blue-500/30 shadow-[0_0_30px_rgba(0,136,255,0.25)]'
          )}
        />

        {/* Glowing Center Core */}
        <div
          className={cn(
            'relative z-10 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300',
            isError
              ? 'bg-red-500/20 border border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              : isSuccess
              ? 'bg-emerald-500/20 border border-emerald-400/70 shadow-[0_0_25px_rgba(16,185,129,0.6)]'
              : 'bg-gradient-to-br from-cyan-500/25 to-blue-600/35 border border-cyan-400/70 shadow-[0_0_25px_rgba(0,242,254,0.45)]'
          )}
        >
          {/* Animated 7-Bar Audio Equalizer Spectrum */}
          <div className="flex items-center gap-[2.5px] h-5 px-1">
            {barHeights.map((hClass, idx) => (
              <motion.div
                key={idx}
                animate={{
                  scaleY: isTyping ? [0.35, 1.3, 0.5, 1.5, 0.4] : [0.5, 1.0, 0.4],
                }}
                transition={{
                  duration: isTyping ? 0.4 + idx * 0.08 : 0.7 + idx * 0.1,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
                className={cn(
                  'w-[2.5px] rounded-full transition-all duration-150',
                  hClass,
                  isError
                    ? 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                    : isSuccess
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                    : 'bg-gradient-to-t from-blue-400 to-cyan-300 shadow-[0_0_6px_rgba(0,242,254,0.8)]'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. LIVE STATUS BADGE: AI VOICE AGENT // NODE ONLINE ──────── */}
      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#050811]/90 border border-cyan-500/30 text-[10px] font-mono tracking-wider text-cyan-300 shadow-[0_0_12px_rgba(0,242,254,0.15)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
        </span>
        <span>AI VOICE AGENT // NODE ONLINE</span>
      </div>
    </div>
  )
}
