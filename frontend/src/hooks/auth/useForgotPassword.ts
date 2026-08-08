// ============================================================
// useForgotPassword Hook
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/store/uiStore'

export function useForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const navigate = useNavigate()

  const sendCode = async (email: string) => {
    if (!email) {
      setEmailError('Email address is required')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address')
      return
    }

    setEmailError(null)
    setLoading(true)
    try {
      await new Promise((res) => setTimeout(res, 1000))
      toast.success('Verification Sent!', `Password reset code sent to ${email}`)
      navigate('/otp-verification', { state: { email, action: 'reset' } })
    } catch {
      toast.error('Error', 'Failed to send reset code.')
    } finally {
      setLoading(false)
    }
  }

  return { sendCode, loading, emailError }
}
