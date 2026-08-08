// ============================================================
// AuthPortalPage — 60/40 Asymmetric Split Screen RAG Vector Portal
// Upgraded with Framer Motion "Masked Spotlight Reveal" (Flashlight Cursor Tracking)
// Demo Admin: vrajgoti07@gmail.com | Demo User: vrajgoti2006@gmail.com
// ============================================================

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, ShieldCheck, ArrowLeft, Terminal, ArrowRight, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/uiStore'
import { apiPost } from '@/services/api'
import { ROUTES, APP_NAME } from '@/constants'
import type { User as UserType } from '@/types'

interface AuthPortalPageProps {
  initialMode?: 'login' | 'register'
}

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseX: number
  baseY: number
}

const LOGIN_TICKERS = [
  '> Awaiting operator authentication...',
  '> Verifying biometric and token clearance...',
  '> Initializing Qdrant vector space...',
  '> Connection secure [Gemini 2.5 Flash].',
]

export function AuthPortalPage({ initialMode = 'login' }: AuthPortalPageProps) {
  const navigate = useNavigate()
  const loginStore = useAuthStore((s) => s.login)

  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; fullName?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)

  // Reset server error when mode changes or on mount
  useEffect(() => {
    setServerError(null)
    setErrors({})
  }, [mode])

  // Log ticker state
  const [logIndex, setLogIndex] = useState(0)

  const handleGoogleAuth = () => {
    toast.info('Google Sign-In', 'Redirecting to Google OAuth2 provider...')
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % LOGIN_TICKERS.length)
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  // ── FRAMER MOTION MASKED SPOTLIGHT REVEAL (FLASHLIGHT EFFECT) ────
  const mouseX = useMotionValue(400)
  const mouseY = useMotionValue(400)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const spotlightMask = useMotionTemplate`radial-gradient(circle 380px at ${mouseX}px ${mouseY}px, black 30%, transparent 100%)`

  // ── HTML5 CANVAS GLOWING RAG BLUEPRINT GRAPH ─────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800)
    let height = (canvas.height = canvas.parentElement?.clientHeight || 800)

    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || 800
      height = canvas.height = canvas.parentElement?.clientHeight || 800
    }

    window.addEventListener('resize', handleResize)

    const nodes: Node[] = Array.from({ length: 28 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1.5,
      baseX: Math.random() * width,
      baseY: Math.random() * height,
    }))

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)'
      ctx.lineWidth = 1

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 130) {
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      nodes.forEach((node) => {
        node.x += node.vx
        node.y += node.vy

        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1

        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = '#38BDF8'
        ctx.shadowColor = '#38BDF8'
        ctx.shadowBlur = 8
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrs: typeof errors = {}

    if (mode === 'register') {
      if (!fullName.trim()) {
        newErrs.fullName = 'Full name is required'
      }
      if (confirmPassword && confirmPassword !== password) {
        newErrs.confirmPassword = 'Passwords do not match'
      }
    }

    if (!email.trim()) {
      newErrs.email = 'Work email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
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
            name: fullName,
            email,
            password,
            confirmPassword,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('SERVER_TIMEOUT')), 12000)
          ),
        ])
        loginStore(res.user, res.token)
        toast.success('Account Created', 'Welcome to Knowledge AI!')
        navigate(res.user.role === 'admin' ? ROUTES.ADMIN : ROUTES.DASHBOARD)
      } else {
        const res = await Promise.race([
          apiPost<{ user: UserType; token: string; refreshToken: string }>('/auth/login', {
            email,
            password,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('SERVER_TIMEOUT')), 12000)
          ),
        ])
        loginStore(res.user, res.token)
        toast.success('Welcome back', `Logged in as ${res.user.name}`)
        navigate(res.user.role === 'admin' ? ROUTES.ADMIN : ROUTES.DASHBOARD)
      }
    } catch (err: any) {
      const isTimeout = err.message === 'SERVER_TIMEOUT' || err.code === 'ECONNABORTED'
      const msg = isTimeout
        ? 'Backend server is not responding. Make sure it is running on port 8000.'
        : err.response?.data?.detail || 'Invalid email or password. Please try again.'
      setServerError(msg)
      toast.error('Authentication Failed', msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0f1c] text-[#F1F5F9] flex flex-col lg:flex-row relative overflow-hidden selection:bg-[#38BDF8]/30 selection:text-[#38BDF8]">
      {/* ── LEFT SECTION (60% Width) — MASKED SPOTLIGHT REVEAL & CONTENT ── */}
      <div
        onMouseMove={handleMouseMove}
        className="hidden lg:flex lg:w-[60%] relative flex-col justify-between p-10 overflow-hidden bg-[#0a0f1c] select-none"
      >
        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#38BDF8] to-[#3B82F6] text-white flex items-center justify-center font-bold text-base shadow-md">
              K
            </div>
            <span className="text-[#F1F5F9] font-bold text-lg tracking-tight group-hover:text-[#38BDF8] transition-colors">
              {APP_NAME}
            </span>
          </Link>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121A2C]/80 border border-[#1E293B] text-xs font-mono text-[#38BDF8]">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            <span>NODE CONNECTION STANDBY</span>
          </div>
        </div>

        {/* MASKED SPOTLIGHT REVEAL LAYER (Flashlight effect uncovering RAG network) */}
        <motion.div
          style={{ maskImage: spotlightMask, WebkitMaskImage: spotlightMask }}
          className="absolute inset-0 z-0 pointer-events-none"
        >
          <canvas ref={canvasRef} className="w-full h-full" />
        </motion.div>

        {/* Center Graphic & Headlines */}
        <div className="relative z-10 max-w-xl space-y-5 my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-xs text-[#38BDF8] font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>Secure Session Encrypted</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#F1F5F9] tracking-tight leading-tight">
            Re-engage Your{' '}
            <span className="text-[#38BDF8] bg-clip-text text-transparent bg-gradient-to-r from-[#38BDF8] to-[#60A5FA]">
              Knowledge Network.
            </span>
          </h1>

          <p className="text-base text-[#94A3B8] leading-relaxed">
            Access your secure vector database, resume active AI conversations, and continue synthesizing insights from your connected enterprise documents.
          </p>
        </div>

        {/* Bottom Left Monospaced System Log Ticker */}
        <div className="relative z-10 p-4.5 rounded-xl bg-[#0D1220]/90 border border-[#1E293B] backdrop-blur-md max-w-md font-mono text-xs">
          <div className="flex items-center gap-2 text-[#64748B] border-b border-[#1E293B] pb-2 mb-2 text-[11px] tracking-wider uppercase">
            <Terminal className="w-4 h-4 text-[#38BDF8]" />
            <span>SYSTEM LOG TICKER</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={logIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-[#38BDF8] font-semibold tracking-wide text-xs"
            >
              {LOGIN_TICKERS[logIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* ── RIGHT SECTION (40% Width) — FORM PANEL ───────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full lg:w-[40%] min-h-screen bg-[#111827] border-l border-[#1E293B] flex flex-col justify-between p-8 sm:p-12 z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
      >
        {/* Header / Top Nav */}
        <div className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#38BDF8] to-[#3B82F6] text-white flex items-center justify-center font-bold text-base">
              K
            </div>
            <span className="text-[#F1F5F9] font-bold text-lg">{APP_NAME}</span>
          </div>

          <Link
            to="/"
            className="text-xs font-semibold text-[#94A3B8] hover:text-[#38BDF8] flex items-center gap-1.5 ml-auto px-4 py-2 rounded-full bg-[#18212f] border border-[#1E293B] hover:border-[#38BDF8]/40 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Dynamic Form Area */}
        <div className="my-auto py-6 space-y-6 max-w-md w-full mx-auto">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9] tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8]">
              {mode === 'login'
                ? 'Enter your credentials to access your workspace.'
                : 'Enter your details to request access to your workspace.'}
            </p>
          </div>

          {/* Form Core */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="space-y-4">
              {/* Full Name Input (Register Mode) */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#F1F5F9]">Full Name</label>
                  <div className="flex items-center rounded-xl bg-[#18212f] border border-[#1E293B] focus-within:border-[#38BDF8] focus-within:ring-1 focus-within:ring-[#38BDF8]/40 transition-all px-4 py-3">
                    <User className="w-4.5 h-4.5 text-[#60A5FA] mr-3 shrink-0" />
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="off"
                      name="fullname-kai"
                      style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                      className="w-full bg-transparent text-xs sm:text-sm text-[#F1F5F9] placeholder-[#64748B] p-0 border-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-none shadow-none"
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}
                </div>
              )}

              {/* Work Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#F1F5F9]">Work Email</label>
                <div
                  className={`flex items-center rounded-xl bg-[#18212f] border transition-all px-4 py-3 ${
                    errors.email
                      ? 'border-red-500/70 ring-1 ring-red-500/30'
                      : 'border-[#1E293B] focus-within:border-[#38BDF8] focus-within:ring-1 focus-within:ring-[#38BDF8]/40'
                  }`}
                >
                  <Mail className={`w-4.5 h-4.5 mr-3 shrink-0 ${errors.email ? 'text-red-400' : 'text-[#60A5FA]'}`} />
                  <input
                    type="text"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setServerError(null); if (errors.email) setErrors(p => ({ ...p, email: undefined })) }}
                    autoComplete="off"
                    name="email-kai"
                    inputMode="email"
                    style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                    className="w-full bg-transparent text-xs sm:text-sm text-[#F1F5F9] placeholder-[#64748B] p-0 border-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-none shadow-none"
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-red-400 mt-1 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#F1F5F9]">Password</label>
                  {mode === 'login' && (
                    <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs text-[#38BDF8] hover:underline font-medium">
                      Forgot Password?
                    </Link>
                  )}
                </div>
                <div
                  className={`flex items-center rounded-xl bg-[#18212f] border transition-all px-4 py-3 ${
                    errors.password
                      ? 'border-red-500/70 ring-1 ring-red-500/30'
                      : 'border-[#1E293B] focus-within:border-[#38BDF8] focus-within:ring-1 focus-within:ring-[#38BDF8]/40'
                  }`}
                >
                  <Lock className={`w-4.5 h-4.5 mr-3 shrink-0 ${errors.password ? 'text-red-400' : 'text-[#60A5FA]'}`} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setServerError(null); if (errors.password) setErrors(p => ({ ...p, password: undefined })) }}
                    autoComplete="new-password"
                    name="password-kai"
                    style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                    className="w-full bg-transparent text-xs sm:text-sm text-[#F1F5F9] placeholder-[#64748B] p-0 border-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-none shadow-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-[#64748B] hover:text-[#F1F5F9] ml-2 cursor-pointer transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-red-400 mt-1 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              {/* Confirm Password Input (Register Mode) */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#F1F5F9]">Confirm Password</label>
                  <div className="flex items-center rounded-xl bg-[#18212f] border border-[#1E293B] focus-within:border-[#38BDF8] focus-within:ring-1 focus-within:ring-[#38BDF8]/40 transition-all px-4 py-3">
                    <Lock className="w-4.5 h-4.5 text-[#60A5FA] mr-3 shrink-0" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      name="confirm-password-kai"
                      style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                      className="w-full bg-transparent text-xs sm:text-sm text-[#F1F5F9] placeholder-[#64748B] p-0 border-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-none shadow-none"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
                </div>
              )}
            </div>

            {/* Remember Me — login mode only */}
            {mode === 'login' && (
              <div className="flex items-center gap-2.5 px-1">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe(v => !v)}
                  className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all cursor-pointer"
                  style={rememberMe ? {
                    backgroundColor: '#38BDF8',
                    border: '1px solid #38BDF8',
                  } : {
                    backgroundColor: 'transparent',
                    border: '1px solid #1E293B',
                  }}
                >
                  {rememberMe && (
                    <svg className="w-2.5 h-2.5 text-[#0F172A]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 12 12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </button>
                <span className="text-xs" style={{ color: '#64748B' }}>Remember me on this device</span>
              </div>
            )}

            {/* Server Error Banner */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400"
                >
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs font-medium leading-relaxed">{serverError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 rounded-full bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0F172A] font-bold text-xs sm:text-sm tracking-wide shadow-[0_4px_20px_rgba(56,189,248,0.35)] hover:shadow-[0_6px_25px_rgba(56,189,248,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Authorize Session' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Continue with Google */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#1E293B]" />
              <span className="text-xs font-mono text-[#64748B] uppercase tracking-wider">Or Continue With</span>
              <div className="flex-1 h-px bg-[#1E293B]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full h-11 rounded-xl bg-[#18212f] border border-[#1E293B] hover:border-[#38BDF8]/50 hover:bg-[#1f2b3e] text-[#F1F5F9] font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md active:scale-[0.98]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
            </button>
          </div>

          {/* State Switcher Link */}
          <div className="pt-4 text-center border-t border-[#1E293B]">
            {mode === 'login' ? (
              <p className="text-xs sm:text-sm text-[#94A3B8]">
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register')
                    navigate('/register', { replace: true })
                  }}
                  className="text-[#38BDF8] font-semibold hover:underline cursor-pointer ml-1"
                >
                  [Request Access]
                </button>
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-[#94A3B8]">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    navigate('/login', { replace: true })
                  }}
                  className="text-[#38BDF8] font-semibold hover:underline cursor-pointer ml-1"
                >
                  [Sign In]
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Panel Footer */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] pt-4 border-t border-[#1E293B]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>SOC2 TYPE II SECURE</span>
          </div>
          <span>v2.5.0-RAG</span>
        </div>
      </motion.div>
    </div>
  )
}
