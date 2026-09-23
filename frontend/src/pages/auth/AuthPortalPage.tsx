// ============================================================
// AuthPortalPage — Knowledge AI Authentication Gateway
// Visual System: Holographic Intelligence Atmosphere
// Features:
// 1. Holographic Intelligence Atmosphere: Floating translucent knowledge glass fragments,
//    soft light refraction sweeps, atmospheric depth, and spatial mouse parallax.
// 2. Global AuthHeaderControls: Top-Left glassmorphic "← Back" button & truthful Acoustic Core health badge.
// 3. Glassmorphic VoiceAuthCard with 3D VoiceAgentOrb status header.
// 4. Accessible cyber inputs with semantic autofill compatibility and password reveal.
// 5. Electric blue primary CTA button.
// 6. Seamless mode switching with Framer Motion slide/crossfade transitions.
// Strict Palette: Deep Space Black #050811, Voice Active #22D3EE, Accent Primary #3B82F6
// ============================================================

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, KeyRound } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/uiStore'
import { apiPost } from '@/services/api'
import { ROUTES } from '@/constants'
import { AuthHeaderControls } from '@/components/auth/AuthHeaderControls'
import { HolographicIntelligenceBackground } from '@/components/auth/HolographicIntelligenceBackground'
import { VoiceAuthCard } from '@/components/auth/VoiceAuthCard'
import { CyberInput } from '@/components/auth/CyberInput'
import type { User as UserType } from '@/types'

interface AuthPortalPageProps {
  initialMode?: 'login' | 'register'
}

export function AuthPortalPage({ initialMode = 'login' }: AuthPortalPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const loginStore = useAuthStore((s) => s.login)

  const currentPathMode = location.pathname.includes('register') ? 'register' : initialMode
  const [mode, setMode] = useState<'login' | 'register'>(currentPathMode)

  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('register')
    } else if (location.pathname === '/login') {
      setMode('login')
    }
  }, [location.pathname])

  // Form Inputs — Initialized strictly empty on load
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [activityLevel, setActivityLevel] = useState(0)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [targetDestination, setTargetDestination] = useState<string>(ROUTES.DASHBOARD)
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; fullName?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)

  // ── ACTIVITY LEVEL COMPUTATION ─────────────────────────────
  // Tracks how many form inputs are currently focused and whether
  // fields have content. Produces a 0-1 value that rises on focus/
  // keystroke and decays on blur when fields are empty.
  const focusCountRef = useRef(0)
  const keystrokeSpikeRef = useRef(0)
  const activityTargetRef = useRef(0)
  const decayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fieldValuesRef = useRef({ email, password, confirmPassword, fullName })

  // Keep ref in sync with state on every render
  fieldValuesRef.current = { email, password, confirmPassword, fullName }

  const computeActivityTarget = () => {
    const hasFocus = focusCountRef.current > 0
    const vals = fieldValuesRef.current
    const filledFields = [vals.email, vals.password, vals.confirmPassword, vals.fullName].filter((v) => v.length > 0).length
    const contentBoost = Math.min(filledFields * 0.15, 0.6)

    if (hasFocus) {
      activityTargetRef.current = Math.min(0.4 + contentBoost + keystrokeSpikeRef.current, 1.0)
    } else if (filledFields > 0) {
      activityTargetRef.current = Math.min(0.15 + contentBoost * 0.5, 0.4)
    } else {
      activityTargetRef.current = 0
    }
  }

  // Smooth decay/rise interval — runs once on mount, reads from refs
  useEffect(() => {
    decayIntervalRef.current = setInterval(() => {
      // Decay keystroke spike
      keystrokeSpikeRef.current = Math.max(0, keystrokeSpikeRef.current - 0.02)
      computeActivityTarget()

      setActivityLevel((prev) => {
        const target = activityTargetRef.current
        const diff = target - prev
        if (Math.abs(diff) < 0.005) return target
        // Asymmetric: fast rise (~150ms), slow decay (~600ms)
        const rate = diff > 0 ? 0.12 : 0.03
        return prev + diff * rate
      })
    }, 50)

    return () => {
      if (decayIntervalRef.current) clearInterval(decayIntervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFieldFocus = () => {
    focusCountRef.current += 1
    computeActivityTarget()
  }

  const handleFieldBlur = () => {
    focusCountRef.current = Math.max(0, focusCountRef.current - 1)
    computeActivityTarget()
  }

  // Reset inputs when mode changes
  useEffect(() => {
    setServerError(null)
    setErrors({})
    setIsSuccess(false)
  }, [mode])

  // Trigger dynamic acoustic wave reactivity on typing
  const triggerTypingPulse = () => {
    setIsTyping(true)
    keystrokeSpikeRef.current = Math.min(keystrokeSpikeRef.current + 0.15, 0.4)
    computeActivityTarget()
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 750)
  }

  const handleGoogleAuth = () => {
    toast.info('Google SSO Unavailable', 'Google OAuth is not configured on this server. Please use email and password.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || isSuccess) return

    const newErrs: typeof errors = {}

    if (mode === 'register') {
      if (!fullName.trim()) {
        newErrs.fullName = 'Full name is required'
      }
      if (!confirmPassword) {
        newErrs.confirmPassword = 'Confirm your password'
      } else if (confirmPassword !== password) {
        newErrs.confirmPassword = 'Passwords do not match'
      }
    }

    if (!email.trim()) {
      newErrs.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrs.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrs.password = 'Password is required'
    } else if (password.length < 6) {
      newErrs.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrs)
    if (Object.keys(newErrs).length > 0) return

    setIsLoading(true)
    setServerError(null)

    try {
      if (mode === 'register') {
        const res = await Promise.race([
          apiPost<{ user: UserType; token: string; refreshToken: string }>('/auth/register', {
            name: fullName.trim(),
            email: email.trim(),
            password,
            confirmPassword,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('SERVER_TIMEOUT')), 10000)
          ),
        ])
        loginStore(res.user, res.token, rememberMe)
        setTargetDestination(res.user.role === 'admin' ? ROUTES.ADMIN : ROUTES.DASHBOARD)
        setIsSuccess(true)
        toast.success('Account Created', 'Welcome to Knowledge AI')
      } else {
        const res = await Promise.race([
          apiPost<{ user: UserType; token: string; refreshToken: string }>('/auth/login', {
            email: email.trim(),
            password,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('SERVER_TIMEOUT')), 10000)
          ),
        ])
        loginStore(res.user, res.token, rememberMe)
        setTargetDestination(res.user.role === 'admin' ? ROUTES.ADMIN : ROUTES.DASHBOARD)
        setIsSuccess(true)
        toast.success('Authentication Successful', `Welcome back, ${res.user.name}`)
      }
    } catch (err: any) {
      const isTimeout = err.message === 'SERVER_TIMEOUT' || err.code === 'ECONNABORTED'
      let msg = 'Authentication failed. Please verify your credentials and try again.'

      if (isTimeout) {
        msg = 'Unable to connect to Knowledge AI. Please verify your network and server status.'
      } else if (err.response?.status === 401) {
        msg = 'Email or password is incorrect.'
      } else if (err.response?.status === 400) {
        const detail = err.response?.data?.detail
        if (typeof detail === 'string' && detail.toLowerCase().includes('already exists')) {
          msg = 'An account with this email already exists.'
        } else if (typeof detail === 'string') {
          msg = detail
        } else {
          msg = 'Invalid registration details provided.'
        }
      } else if (err.response?.data?.detail && typeof err.response.data.detail === 'string') {
        msg = err.response.data.detail
      }

      setServerError(msg)
      toast.error('Authentication Error', msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050811] overflow-hidden p-3 sm:p-5 select-none selection:bg-accent-primary/30 selection:text-accent-light">
      {/* ── 1. GLOBAL TOP-LEFT BACK BUTTON & TOP-RIGHT STATUS BADGE ──── */}
      <AuthHeaderControls backTo="/" backLabel="Back to Home" />

      {/* ── 2. HOLOGRAPHIC INTELLIGENCE ATMOSPHERE BACKGROUND ───── */}
      <HolographicIntelligenceBackground
        activityLevel={activityLevel}
        voiceState={serverError ? 'error' : 'idle'}
        isSuccess={isSuccess}
      />

      {/* ── 3. CENTRAL GLASSMORPHIC VOICE AUTH CARD ──────────────────── */}
      <VoiceAuthCard
        title={mode === 'login' ? 'Sign in to Knowledge AI' : 'Create your Knowledge AI account'}
        subtitle={
          mode === 'login'
            ? 'Access your organization’s AI knowledge assistant and voice agent.'
            : 'Create your account to access your organization’s AI knowledge assistant.'
        }
        isSuccess={isSuccess}
        isTyping={isTyping}
        isError={!!serverError}
        successMessage={
          mode === 'login'
            ? 'Clearance Verified // Redirecting...'
            : 'Account Created // Redirecting...'
        }
        onWarpComplete={() => {
          navigate(targetDestination)
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* ── FORM FIELDS (Screen 1 vs Screen 2 Layout) ─────────────── */}
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              /* SCREEN 1: LOGIN FIELDS */
              <motion.div
                key="login-fields"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-2.5"
              >
                <CyberInput
                  label="Work Email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    triggerTypingPulse()
                    setServerError(null)
                    if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
                  }}
                  onFocus={handleFieldFocus}
                  onBlur={handleFieldBlur}
                  error={errors.email}
                  icon={Mail}
                  name="email"
                  autoComplete="username"
                  inputMode="email"
                />

                <CyberInput
                  label="Password"
                  isPassword
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    triggerTypingPulse()
                    setServerError(null)
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                  }}
                  onFocus={handleFieldFocus}
                  onBlur={handleFieldBlur}
                  error={errors.password}
                  icon={Lock}
                  name="password"
                  autoComplete="current-password"
                />
              </motion.div>
            ) : (
              /* SCREEN 2: SIGN UP FIELDS (2-Column Grid on Desktop, 1-Column on Mobile) */
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              >
                <CyberInput
                  label="Full Name"
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    triggerTypingPulse()
                    if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined }))
                  }}
                  onFocus={handleFieldFocus}
                  onBlur={handleFieldBlur}
                  error={errors.fullName}
                  icon={User}
                  name="name"
                  autoComplete="name"
                />

                <CyberInput
                  label="Work Email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    triggerTypingPulse()
                    setServerError(null)
                    if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
                  }}
                  onFocus={handleFieldFocus}
                  onBlur={handleFieldBlur}
                  error={errors.email}
                  icon={Mail}
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                />

                <CyberInput
                  label="Password"
                  isPassword
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    triggerTypingPulse()
                    setServerError(null)
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                  }}
                  onFocus={handleFieldFocus}
                  onBlur={handleFieldBlur}
                  error={errors.password}
                  icon={Lock}
                  name="new-password"
                  autoComplete="new-password"
                />

                <CyberInput
                  label="Confirm Password"
                  isPassword
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    triggerTypingPulse()
                    if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }))
                  }}
                  onFocus={handleFieldFocus}
                  onBlur={handleFieldBlur}
                  error={errors.confirmPassword}
                  icon={Lock}
                  name="confirm-password"
                  autoComplete="new-password"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SAME ROW: Remember Me & Forgot Password (Login Only) ─── */}
          {mode === 'login' && (
            <div className="flex items-center justify-between pt-0.5 px-0.5 text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  id="remember-session-checkbox"
                  aria-label="Remember session"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-all duration-150 border ${rememberMe
                      ? 'bg-accent-primary border-accent-light text-slate-950 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                      : 'bg-slate-950/80 border-slate-700 group-hover:border-accent-primary/50'
                    }`}
                >
                  {rememberMe && (
                    <svg className="w-2.5 h-2.5 text-slate-950 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-[11px] text-slate-300 group-hover:text-white transition-colors">
                  Remember session
                </span>
              </label>

              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-[11px] text-accent-light hover:text-accent-primary transition-colors font-medium hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-light rounded"
              >
                Forgot Password?
              </Link>
            </div>
          )}

          {/* Server Error Alert */}
          <AnimatePresence>
            {serverError && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs"
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0 text-red-400" />
                <span>{serverError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── ACTION BAR: Shimmering Primary Button + Google SSO ─────── */}
          <div className="flex items-center gap-2.5 pt-1">
            {/* High-Energy Primary CTA Button with Equalizer Icon */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              aria-busy={isLoading}
              className="cyber-button btn-shimmer group flex-1 h-10 rounded-lg bg-gradient-to-r from-accent-primary via-accent-primary-hover to-accent-primary hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] text-white font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span className="font-semibold uppercase tracking-wider text-slate-950">
                    {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                  </span>
                </>
              ) : (
                <>
                  {/* Mini Audio Equalizer Icon on Button */}
                  <div className="flex items-center gap-[2px] h-3">
                    <span className="w-[2px] h-2 bg-slate-950 rounded-full group-hover:animate-bounce" />
                    <span className="w-[2px] h-3 bg-slate-950 rounded-full group-hover:animate-bounce [animation-delay:0.12s]" />
                    <span className="w-[2px] h-1.5 bg-slate-950 rounded-full group-hover:animate-bounce [animation-delay:0.24s]" />
                  </div>

                  <span className="font-semibold uppercase tracking-wider text-slate-950">
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-950 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {/* Seamless Dark Glass Google SSO Button (Honestly Labeled as Unavailable) */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              aria-label="Sign in with Google (OAuth not configured)"
              className="h-10 px-3.5 rounded-lg bg-[#050811]/60 hover:bg-[#080E1C] border border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-300 flex items-center justify-center gap-2 text-xs font-medium transition-all duration-150 cursor-pointer shadow-xs active:scale-[0.98] shrink-0 opacity-80"
              title="Google SSO is not configured on this server"
            >
              <svg className="w-4 h-4 shrink-0 grayscale-[40%]" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span className="hidden xs:inline text-[11px] font-mono uppercase text-slate-400">Google SSO</span>
            </button>
          </div>
        </form>

        {/* ── FOOTER: Mode Switcher Link ─────────────────────────────── */}
        <div className="pt-2.5 border-t border-slate-800/70 text-center text-xs">
          {mode === 'login' ? (
            <p className="text-slate-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  navigate('/register')
                }}
                className="text-accent-light font-semibold hover:text-accent-primary hover:underline cursor-pointer ml-0.5"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p className="text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  navigate('/login')
                }}
                className="text-accent-light font-semibold hover:text-accent-primary hover:underline cursor-pointer ml-0.5"
              >
                Log In
              </button>
            </p>
          )}
        </div>
      </VoiceAuthCard>
    </div>
  )
}
