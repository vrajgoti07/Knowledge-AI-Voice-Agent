// ============================================================
// ForgotPasswordPage — 3D Spatial Environment Recovery Interface
// Features Infinite Drifting 3D Grid Floor, Floating Spatial Glass Panel,
// Reactive 3D Cyber-Padlock Hologram, Keystroke Mapping,
// & 3D Extruded Z-Axis Action Button
// ============================================================

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ShieldCheck, ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Sparkles } from 'lucide-react'
import { ROUTES, APP_NAME } from '@/constants'
import { BrainNetworkMotif } from '@/components/common/BrainNetworkMotif'

const MATRIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$&*%'

// ── Custom Decryption Scramble Text Label Component ──────────────
function DecryptionLabel({ label, isFocused }: { label: string; isFocused: boolean }) {
  const [displayText, setDisplayText] = useState(label)

  useEffect(() => {
    let iteration = 0
    const interval = setInterval(() => {
      setDisplayText(
        label
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' '
            if (index < iteration) return label[index]
            return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
          })
          .join('')
      )

      if (iteration >= label.length) {
        clearInterval(interval)
      }
      iteration += 1 / 2
    }, 30)

    return () => clearInterval(interval)
  }, [isFocused, label])

  return <span className="font-mono text-xs tracking-wider uppercase text-[#38BDF8]">{displayText}</span>
}

// ── HOLOGRAPHIC QUANTUM SCANNER VISUAL ASSET ─────────────────────
function HolographicQuantumScanner({
  isFocused,
  keystrokes,
}: {
  isFocused: boolean
  keystrokes: number
}) {
  return (
    <div
      className="relative w-64 h-64 flex items-center justify-center perspective-[1000px] select-none"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* ── 1. HOLOGRAPHIC GRID PROJECTION PAD (Background Depth) ── */}
      <div
        className="absolute w-56 h-56 rounded-full flex items-center justify-center pointer-events-none"
        style={{
          transform: 'rotateX(72deg) translateY(20px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Outer Dotted Holographic Ring */}
        <motion.div
          animate={{ rotateZ: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute w-56 h-56 rounded-full border border-dashed border-[#38BDF8]/30 shadow-[0_0_30px_rgba(56,189,248,0.2)]"
        />

        {/* Inner Concentric Grid Ring */}
        <motion.div
          animate={{ rotateZ: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute w-40 h-40 rounded-full border border-[#60A5FA]/40 shadow-[0_0_20px_rgba(96,165,250,0.3)]"
        />

        {/* Concentric Node Pulse */}
        <div className="absolute w-24 h-24 rounded-full border border-[#38BDF8]/50 animate-ping opacity-30" />
      </div>

      {/* Ambient Radial Gradient Glow Overlay */}
      <div className="absolute inset-0 rounded-full bg-[#38BDF8]/15 blur-3xl pointer-events-none -z-10" />

      {/* ── 2. THE LEVITATION CORE (Floating 3D Cyber-Padlock) ──── */}
      <motion.div
        animate={{
          y: [-12, 12, -12],
          rotateX: 10,
          rotateY: -15,
          rotateZ: keystrokes ? [0, 4, -4, 0] : 0,
        }}
        transition={{
          y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          rotateZ: { duration: 0.3 },
        }}
        className="relative z-10 flex flex-col items-center justify-center transition-all duration-500"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Shackle (Animates upward into unlock clearance position on focus) */}
        <motion.div
          animate={{
            y: isFocused ? -10 : 0,
            borderColor: isFocused ? '#38BDF8' : 'rgba(56, 189, 248, 0.8)',
          }}
          transition={{ type: 'spring', stiffness: 220, damping: 15 }}
          className={`w-14 h-16 rounded-t-full border-4 border-[#38BDF8] border-b-0 -mb-2 transition-all duration-300 ${
            isFocused ? 'shadow-[0_0_35px_#38BDF8]' : 'shadow-[0_0_20px_#38BDF8]'
          }`}
        />

        {/* Padlock Body */}
        <motion.div
          animate={{
            scale: isFocused ? 1.05 : 1,
          }}
          transition={{ duration: 0.3 }}
          className={`w-22 h-22 rounded-2xl bg-gradient-to-br from-[#121A2C] via-[#0A0E1A] to-[#0D1527] border-2 transition-all duration-500 flex flex-col items-center justify-center relative backdrop-blur-md ${
            isFocused
              ? 'border-[#38BDF8] shadow-[0_0_55px_rgba(56,189,248,0.85)]'
              : 'border-[#38BDF8]/70 shadow-[0_0_35px_rgba(56,189,248,0.45)]'
          }`}
        >
          {/* Keyhole Core */}
          <div className="w-5 h-7 rounded-full bg-[#38BDF8] shadow-[0_0_20px_#38BDF8] animate-pulse flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#0F172A]" />
          </div>

          {/* Micro Data Stream Corner Accents */}
          <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[#38BDF8]/60" />
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#22C55E]/60" />
          <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-[#60A5FA]/60" />
          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-[#38BDF8]/60" />
        </motion.div>
      </motion.div>

      {/* ── 3. THE SCANNING LASER (Endless Vertical Scan Beam) ────── */}
      <motion.div
        animate={{ y: [-75, 75, -75] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute z-20 pointer-events-none flex flex-col items-center"
      >
        {/* High-Intensity Laser Line */}
        <div className="h-[2px] w-52 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent shadow-[0_0_20px_4px_rgba(56,189,248,0.85)]" />
        {/* Soft Laser Glow Flare */}
        <div className="h-4 w-44 bg-[#38BDF8]/15 blur-md -mt-2" />
      </motion.div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [keystrokes, setKeystrokes] = useState(0)

  // Vector Alignment Submission Animation States
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [alignmentProgress, setAlignmentProgress] = useState(0)
  const [isSuccess, setIsSuccess] = useState(false)

  // ── 3D SPATIAL PARALLAX MOUSE TRACKING ──────────────────────────
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e
    const x = (clientX / window.innerWidth - 0.5) * 16
    const y = (clientY / window.innerHeight - 0.5) * 16
    setMousePos({ x, y })
  }

  // Handle Send Verification Code Request
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)

    if (!email.trim()) {
      setEmailError('Email address is required')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    // Trigger Shatter & Assemble Vector Alignment Ticker
    setIsAuthenticating(true)
    setAlignmentProgress(0)

    let progress = 0
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 5
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)

        setTimeout(() => {
          setIsAuthenticating(false)
          setIsSuccess(true)
        }, 500)
      }
      setAlignmentProgress(progress)
    }, 60)
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full bg-[#030712] text-[#F1F5F9] flex flex-col justify-between items-center relative overflow-hidden selection:bg-[#38BDF8]/30 selection:text-[#38BDF8]"
    >
      {/* ── 1. BACKGROUND ENVIRONMENT: DRIFTING 3D GRID FLOOR VOID ──── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* 3D Infinite Drifting Grid Floor */}
        <div
          className="absolute -inset-[100%] opacity-25"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(56, 189, 248, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.15) 1px, transparent 1px)`,
            backgroundSize: '4rem 4rem',
            transform: 'perspective(900px) rotateX(65deg) translateY(0px) scale(2.2)',
            animation: 'drift3DGrid 16s linear infinite',
          }}
        />
        {/* Gradient Fade to Horizon */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-transparent to-[#030712]" />
      </div>

      <style>{`
        @keyframes drift3DGrid {
          0% { transform: perspective(900px) rotateX(65deg) translateY(0px) scale(2.2); }
          100% { transform: perspective(900px) rotateX(65deg) translateY(64px) scale(2.2); }
        }
      `}</style>

      {/* Ambient Lighting Light Bursts */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#38BDF8]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ── TOP NAV HEADER ───────────────────────────────────────────── */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20 relative">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#38BDF8] to-[#3B82F6] text-white flex items-center justify-center font-bold text-base shadow-lg shadow-[#38BDF8]/20 group-hover:scale-105 transition-transform">
            K
          </div>
          <span className="text-[#F1F5F9] font-bold text-lg tracking-tight group-hover:text-[#38BDF8] transition-colors">
            {APP_NAME}
          </span>
        </Link>

        <Link
          to={ROUTES.LOGIN}
          className="text-xs font-semibold text-[#94A3B8] hover:text-[#38BDF8] flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 hover:border-[#38BDF8]/40 transition-all cursor-pointer backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>
      </header>

      {/* ── 2. THE SPATIAL GLASS CONTAINER (FLOATING IN 3D SPACE) ────── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 w-full perspective-[1200px]">
        <motion.div
          animate={{
            rotateY: mousePos.x * 0.4,
            rotateX: -mousePos.y * 0.4,
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="w-full max-w-4xl rounded-3xl bg-[#0D1527]/80 border border-[#38BDF8]/30 backdrop-blur-2xl p-8 sm:p-12 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(56,189,248,0.18)] relative overflow-hidden group"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Glowing Top Edge Line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/60 to-transparent" />

          {/* ── VECTOR ALIGNMENT SUBMISSION ANIMATION OVERLAY ───────── */}
          <AnimatePresence>
            {isAuthenticating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-[#030712]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center space-y-6"
              >
                {/* 3D Assembling AI Brain Motif */}
                <motion.div
                  animate={{ scale: [0.9, 1.1, 1], rotate: [0, 180, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative flex items-center justify-center"
                >
                  <div className="w-28 h-28 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/40 blur-sm absolute" />
                  <BrainNetworkMotif size={200} />
                </motion.div>

                {/* Monospace Vector Alignment Ticker */}
                <div className="space-y-2 font-mono">
                  <div className="text-3xl font-extrabold text-[#38BDF8] tracking-widest">
                    {alignmentProgress.toFixed(2)}%
                  </div>
                  <p className="text-xs text-[#94A3B8] uppercase tracking-wider">
                    {alignmentProgress < 100 ? 'SENDING VERIFICATION CODE...' : 'CODE DISPATCHED'}
                  </p>

                  <div className="w-48 h-1.5 rounded-full bg-[#1E293B] overflow-hidden mx-auto mt-4">
                    <div
                      className="h-full bg-gradient-to-r from-[#38BDF8] to-[#6366F1] transition-all duration-100"
                      style={{ width: `${alignmentProgress}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SUCCESS RESOLUTION STATE ──────────────────────────────── */}
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 space-y-6 text-center max-w-md mx-auto"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/40 flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.4)]">
                <CheckCircle2 className="w-9 h-9 text-[#38BDF8]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-[#F1F5F9] tracking-tight">
                  Check Your Email
                </h2>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
                  We've dispatched a 6-digit verification code to{' '}
                  <span className="text-[#38BDF8] font-semibold">{email}</span>. The code will expire in 15 minutes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="w-full h-12 rounded-full bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0F172A] font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_30px_rgba(56,189,248,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Return to Login</span>
              </button>
            </motion.div>
          ) : (
            /* ── 3. SPLIT DYNAMIC LAYOUT: 3D HOLOGRAM LEFT + FORM RIGHT ── */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column (5 Cols): Prominent 3D Security Hologram Padlock */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
                <HolographicQuantumScanner isFocused={isFocused} keystrokes={keystrokes} />
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#38BDF8] mt-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isFocused ? 'CLEARANCE PROTOCOL READY' : 'QUANTUM SCANNER ONLINE'}</span>
                </div>
              </div>

              {/* Right Column (7 Cols): Password Recovery Form */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-xs text-[#38BDF8]">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>PASSWORD RECOVERY</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9] tracking-tight">
                    Forgot Password
                  </h1>
                  <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    Enter your work email address and we'll send a 6-digit verification code.
                  </p>
                </div>

                {/* Form with Decryption Labels & Keystroke-Mapped Input */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <DecryptionLabel label="WORK EMAIL ADDRESS" isFocused={isFocused} />
                      <Mail className="w-4 h-4 text-[#38BDF8]" />
                    </div>
                    <div className="relative border-b border-[#38BDF8]/40 focus-within:border-[#38BDF8] transition-colors pb-2">
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setKeystrokes((prev) => prev + 1)
                        }}
                        style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                        className="w-full bg-transparent text-xs sm:text-sm text-[#F1F5F9] placeholder-[#64748B] p-0 focus:outline-none"
                      />
                    </div>
                    {emailError && <p className="text-xs text-red-400 mt-1">{emailError}</p>}
                  </div>

                  {/* 4. TRUE 3D EXTRUDED Z-AXIS ACTION BUTTON */}
                  <div className="pt-2 perspective-[500px]">
                    <button
                      type="submit"
                      className="w-full h-13 rounded-full bg-gradient-to-r from-[#38BDF8] to-[#3B82F6] hover:from-[#60A5FA] hover:to-[#2563EB] text-[#0F172A] font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 transform-gpu hover:translate-z-[16px] hover:scale-[1.02] shadow-[0_4px_20px_rgba(56,189,248,0.35)] hover:shadow-[0_20px_40px_rgba(56,189,248,0.55)] active:scale-[0.98]"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Footer Switcher */}
                <div className="pt-4 text-center border-t border-[#1E293B]">
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    Remember your password?{' '}
                    <Link
                      to={ROUTES.LOGIN}
                      className="text-[#38BDF8] font-semibold hover:underline cursor-pointer ml-1"
                    >
                      Return to Login
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2 z-20 relative">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>SOC2 TYPE II SECURE PROTOCOL</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-[#94A3B8]">Gemini 2.5 Flash RAG Operational</span>
        </div>
      </footer>
    </div>
  )
}
