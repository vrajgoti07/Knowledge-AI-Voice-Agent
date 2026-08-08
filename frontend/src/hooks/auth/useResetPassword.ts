// ============================================================
// useResetPassword Hook
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/store/uiStore'

export function useResetPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const resetPassword = async (newPass: string, confirmPass: string) => {
    if (!newPass || newPass.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    if (newPass !== confirmPass) {
      setError('Passwords do not match')
      return
    }

    setError(null)
    setLoading(true)
    try {
      await new Promise((res) => setTimeout(res, 1200))
      toast.success('Password Reset Successful!', 'You can now log in with your new password.')
      navigate('/login')
    } catch {
      toast.error('Reset Failed', 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  return { resetPassword, loading, error }
}
