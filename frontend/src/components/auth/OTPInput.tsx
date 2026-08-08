// ============================================================
// OTPInput — 6-Digit Verification Code Component
// ============================================================

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, CheckCircle2 } from 'lucide-react'
import { cn } from '@/utils'

export function OTPInput({
  onComplete,
  onResend,
  length = 6,
}: {
  onComplete: (code: string) => void
  onResend: () => void
  length?: number
}) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''))
  const [timer, setTimer] = useState(60)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) return
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    return () => clearInterval(interval)
  }, [timer])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    if (!val) {
      const nextOtp = [...otp]
      nextOtp[index] = ''
      setOtp(nextOtp)
      return
    }

    const char = val.slice(-1)
    const nextOtp = [...otp]
    nextOtp[index] = char
    setOtp(nextOtp)

    // Check complete
    if (nextOtp.every((digit) => digit !== '')) {
      onComplete(nextOtp.join(''))
    } else if (index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length)
    if (!pasted) return

    const nextOtp = [...otp]
    for (let i = 0; i < pasted.length; i++) {
      nextOtp[i] = pasted[i]
    }
    setOtp(nextOtp)

    if (pasted.length === length) {
      onComplete(pasted)
      inputRefs.current[length - 1]?.focus()
    } else {
      inputRefs.current[pasted.length]?.focus()
    }
  }

  const handleResendClick = () => {
    setTimer(60)
    setOtp(Array(length).fill(''))
    onResend()
    inputRefs.current[0]?.focus()
  }

  return (
    <div className="space-y-6">
      {/* 6 Input Boxes */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onPaste={handlePaste}
            className={cn(
              'w-11 h-13 sm:w-12 sm:h-14 text-center font-mono font-bold text-xl sm:text-2xl rounded-xl',
              'bg-bg-secondary border border-border/80 text-text-primary outline-none transition-all',
              'focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 focus:bg-bg-elevated',
              digit && 'border-accent-green/60 bg-accent-green/5'
            )}
          />
        ))}
      </div>

      {/* Resend & Timer */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Didn't receive code?</span>
        {timer > 0 ? (
          <span className="font-mono text-accent-blue font-semibold">Resend in {timer}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResendClick}
            className="text-accent-green hover:underline font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Resend Code</span>
          </button>
        )}
      </div>
    </div>
  )
}
