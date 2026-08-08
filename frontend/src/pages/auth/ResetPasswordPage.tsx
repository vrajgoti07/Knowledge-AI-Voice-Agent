// ============================================================
// ResetPasswordPage — Create New Password Page
// ============================================================

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Loader2, Key } from 'lucide-react'
import { AuthCard } from '@/components/auth/AuthCard'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { AuthFooter } from '@/components/auth/AuthFooter'
import { useResetPassword } from '@/hooks/auth/useResetPassword'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants'

export default function ResetPasswordPage() {
  usePageTitle('Reset Password')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { resetPassword, loading, error } = useResetPassword()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    resetPassword(newPassword, confirmPassword)
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Create New Password"
        subtitle="Your identity is verified. Choose a strong new password."
        icon={Key}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          label="New Password"
          placeholder="••••••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={error || undefined}
        />

        <PasswordStrength password={newPassword} />

        <PasswordInput
          label="Confirm New Password"
          placeholder="••••••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-glow-green mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-bg-primary" />
              <span>Updating Password...</span>
            </>
          ) : (
            <>
              <span>Reset Password</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>

        <AuthFooter
          promptText="Remembered existing credentials?"
          linkText="Back to Login"
          href={ROUTES.LOGIN}
        />
      </form>
    </AuthCard>
  )
}
