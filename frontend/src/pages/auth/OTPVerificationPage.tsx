// ============================================================
// OTPVerificationPage — 6-Digit OTP Code Verification Form
// ============================================================

import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { AuthCard } from '@/components/auth/AuthCard'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { OTPInput } from '@/components/auth/OTPInput'
import { AuthFooter } from '@/components/auth/AuthFooter'
import { useOTP } from '@/hooks/auth/useOTP'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants'

export default function OTPVerificationPage() {
  usePageTitle('Verify Security Code')
  const location = useLocation()
  const email = (location.state as { email?: string })?.email || 'user@khnowlge.ai'
  const action = (location.state as { action?: 'register' | 'reset' })?.action || 'register'

  const { verifyOTP, resendCode, loading } = useOTP()

  const handleComplete = (code: string) => {
    verifyOTP(code, email, action)
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Verification Required"
        subtitle={`Enter the 6-digit verification code sent to ${email}`}
        icon={ShieldCheck}
      />

      <div className="space-y-6">
        <OTPInput onComplete={handleComplete} onResend={resendCode} />

        {loading && (
          <div className="flex items-center justify-center gap-2 text-xs text-accent-green font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying code...</span>
          </div>
        )}

        <p className="text-[11px] text-text-muted text-center italic">
          Test Tip: Enter any 6-digit code or <span className="text-accent-green font-mono font-bold">123456</span> to verify.
        </p>

        <AuthFooter
          promptText="Entered the wrong email?"
          linkText="Go back to login"
          href={ROUTES.LOGIN}
        />
      </div>
    </AuthCard>
  )
}
