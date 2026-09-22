// ============================================================
// VoiceAgentOrb — 3D-Styled Multi-Ring AI Voice Visualizer Orb
// Features:
// 1. 3D-styled multi-ring voice visualizer orb with rotating dashed frequency ring.
// 2. Concentric soundwave pulse rings expanding dynamically during input focus & typing.
// 3. Dynamic 7-bar audio spectrum equalizer dancing in real-time.
// 4. Live status indicator badge: "AI VOICE AGENT // NODE ONLINE".
// Colors: Uses unified design tokens from index.css @theme.
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
              ? 'border-danger/50'
              : isSuccess
              ? 'border-success/60'
              : 'border-voice-active/40 shadow-[0_0_20px_var(--color-voice-glow)]'
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
              ? 'border-danger shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              : isSuccess
              ? 'border-success shadow-[0_0_25px_rgba(34,197,94,0.5)]'
              : 'border-voice-active/60 shadow-[0_0_25px_var(--color-voice-glow)]'
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
              ? 'border-danger/30'
              : isSuccess
              ? 'border-success/40'
              : 'border-accent-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.25)]'
          )}
        />

        {/* Glowing Center Core */}
        <div
          className={cn(
            'relative z-10 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300',
            isError
              ? 'bg-danger/20 border border-danger/60 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              : isSuccess
              ? 'bg-success/20 border border-success/70 shadow-[0_0_25px_rgba(34,197,94,0.6)]'
              : 'bg-gradient-to-br from-voice-active/25 to-accent-primary/35 border border-voice-active/70 shadow-[0_0_25px_var(--color-voice-glow)]'
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
                    ? 'bg-danger shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                    : isSuccess
                    ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.9)]'
                    : 'bg-gradient-to-t from-accent-primary to-voice-active shadow-[0_0_6px_var(--color-voice-glow)]'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. LIVE STATUS BADGE: AI VOICE AGENT // NODE ONLINE ──────── */}
      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-bg-page/90 border border-accent-primary/30 text-[10px] font-mono tracking-wider text-accent-light shadow-[0_0_12px_rgba(59,130,246,0.15)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-voice-active opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-voice-active" />
        </span>
        <span>AI VOICE AGENT // NODE ONLINE</span>
      </div>
    </div>
  )
}

