// ============================================================
// ForgotPasswordPage — AI Voiceprint & Access Recovery Gateway
// Screen 3: Voiceprint & Access Recovery
// Features:
// 1. Dedicated AcousticRadarBackground: 360° Rotating Radar Sonar Sweep & Target Grid.
// 2. Global AuthHeaderControls: Top-Left glassmorphic "← Back to Login" button & live status beacon.
// 3. Centered glowing Padlock enveloped by radiating concentric soundwave radar rings.
// 4. Soundwave-styled email input with autofill protection and context hint.
// 5. "Send Verification Code" primary CTA button with mini equalizer animation.
// Strict Palette: Deep Space Black #050811, Neural Cyan #00F2FE, Electric Blue #0088FF
// ============================================================

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { ROUTES, APP_NAME } from '@/constants'
import { AppLogo } from '@/components/common/AppLogo'
import { toast } from '@/store/uiStore'
import { apiPost } from '@/services/api'
import { AuthHeaderControls } from '@/components/auth/AuthHeaderControls'
import { AcousticRadarBackground } from '@/components/auth/AcousticRadarBackground'
import { CyberInput } from '@/components/auth/CyberInput'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activityLevel, setActivityLevel] = useState(0)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerTypingPulse = () => {
    setActivityLevel(1.0)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setActivityLevel(0)
    }, 750)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Work email is required')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid work email address')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      await Promise.race([
        apiPost('/auth/forgot-password', { email }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SERVER_TIMEOUT')), 10000)
        ),
      ])
      setIsSuccess(true)
      toast.success('Access Token Dispatched', 'Check your inbox for your security recovery code.')
    } catch (err: any) {
      const isTimeout = err.message === 'SERVER_TIMEOUT' || err.code === 'ECONNABORTED'
      if (isTimeout) {
        setIsSuccess(true)
        toast.info('Offline Demo Token', 'Recovery link simulated: check your credentials.')
      } else {
        const msg = err.response?.data?.detail || 'Could not dispatch recovery token. Please verify email.'
        setError(msg)
        toast.error('Recovery Failed', msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050811] overflow-hidden p-3 sm:p-5 select-none selection:bg-accent-primary/30 selection:text-accent-light">
      {/* ── 1. GLOBAL TOP-LEFT BACK BUTTON & TOP-RIGHT STATUS BADGE ──── */}
      <AuthHeaderControls backTo={ROUTES.LOGIN} backLabel="Back to Login" />

      {/* ── 2. DEDICATED 360° ACOUSTIC RADAR & SONAR SWEEP BACKGROUND ── */}
      <AcousticRadarBackground activityLevel={activityLevel} />

      {/* ── 3. CENTRAL GLASSMORPHIC RECOVERY CARD ────────────────────── */}
      <div className="relative w-full max-w-lg mx-auto z-20 flex items-center justify-center p-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full bg-[#050811]/75 backdrop-blur-2xl border border-slate-700/50 border-t-accent-light/40 rounded-2xl shadow-[0_0_60px_rgba(59,130,246,0.22)] p-5 sm:p-7 relative overflow-hidden"
        >
          {/* Top Neon Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-light/50 to-transparent" />

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

          {/* ── 4. HERO GRAPHIC: GLOWING PADLOCK ENVELOPED BY SOUNDWAVE RADAR ── */}
          <div className="py-3 flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Radiating Soundwave Radar Scan Ring 1 */}
              <motion.div
                animate={{ scale: [1, 1.45, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border border-accent-light/40 shadow-[0_0_25px_rgba(59,130,246,0.35)]"
              />

              {/* Radiating Soundwave Radar Scan Ring 2 */}
              <motion.div
                animate={{ scale: [1.1, 1.7, 1.1], opacity: [0.15, 0.45, 0.15] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="absolute -inset-1 rounded-full border border-blue-500/30 shadow-[0_0_30px_rgba(0,136,255,0.25)]"
              />

              {/* Central Glowing Core Container */}
              <div className="relative z-10 w-13 h-13 rounded-full bg-gradient-to-br from-voice-active/25 to-accent-primary/35 border border-accent-light/70 shadow-[0_0_25px_rgba(59,130,246,0.45)] flex items-center justify-center backdrop-blur-md">
                <Lock className="w-6 h-6 text-accent-light drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center pt-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Acoustic Voiceprint Recovery
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Enter your registered work email to receive an instant acoustic security recovery token.
              </p>
            </div>
          </div>

          {/* ── 5. RECOVERY FORM OR SUCCESS CONFIRMATION ──────────────── */}
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.form
                key="recovery-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 pt-1"
                autoComplete="off"
              >
                <div className="space-y-1">
                  <CyberInput
                    label="Work Email Address"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      triggerTypingPulse()
                      setError(null)
                    }}
                    error={error || undefined}
                    icon={Mail}
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                  />
                  <p className="text-[10px] text-slate-400 px-1">
                    A 6-digit cryptographic authentication code will be dispatched to this node address.
                  </p>
                </div>

                {/* Submit Action Button with Mini Equalizer */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="cyber-button btn-shimmer group w-full h-10 rounded-lg bg-gradient-to-r from-accent-primary via-accent-primary-hover to-accent-primary hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] text-white font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    ) : (
                      <>
                        <div className="flex items-center gap-[2px] h-3">
                          <span className="w-[2px] h-2 bg-slate-950 rounded-full group-hover:animate-bounce" />
                          <span className="w-[2px] h-3 bg-slate-950 rounded-full group-hover:animate-bounce [animation-delay:0.12s]" />
                          <span className="w-[2px] h-1.5 bg-slate-950 rounded-full group-hover:animate-bounce [animation-delay:0.24s]" />
                        </div>
                        <span className="font-semibold uppercase tracking-wider text-slate-950">
                          Send Verification Code
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-950 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            ) : (
              /* Success State Confirmation */
              <motion.div
                key="recovery-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 pt-2 text-center"
              >
                <div className="p-3 rounded-xl bg-success/10 border border-success/30 text-success text-xs space-y-1">
                  <div className="font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>Recovery Code Transmitted</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    We sent a secure verification token to <span className="font-mono text-accent-light">{email}</span>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.OTP_VERIFICATION, { state: { email } })}
                    className="flex-1 h-9 rounded-lg bg-accent-primary hover:bg-accent-primary-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Enter 6-Digit Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSuccess(false)}
                    className="h-9 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                  >
                    Resend
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 6. FOOTER: RETURN TO LOGIN LINK ────────────────────────── */}
          <div className="mt-4 pt-3 border-t border-slate-800/70 text-center text-xs">
            <p className="text-slate-400">
              Remembered your credentials?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="text-accent-light font-semibold hover:text-accent-primary hover:underline cursor-pointer ml-0.5"
              >
                Log In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
