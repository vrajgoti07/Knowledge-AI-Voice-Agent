// ============================================================
// useOTP Hook — OTP Verification & Resend handling
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/uiStore'

export function useOTP() {
  const [loading, setLoading] = useState(false)
  const { setUser, setToken } = useAuthStore()
  const navigate = useNavigate()

  const verifyOTP = async (code: string, email: string, action: 'register' | 'reset') => {
    setLoading(true)
    try {
      await new Promise((res) => setTimeout(res, 1000))

      if (code !== '123456' && code.length !== 6) {
        toast.error('Invalid OTP', 'The 6-digit code entered is invalid or expired.')
        setLoading(false)
        return
      }

      if (action === 'register') {
        const user = {
          id: 'usr_new',
          name: 'New Researcher',
          email: email || 'user@khnowlge.ai',
          role: 'user' as const,
          plan: 'free' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setUser(user)
        setToken('mock_jwt_token_verified_123')
        toast.success('Account Verified!', 'Your email has been verified.')
        navigate('/account-verified')
      } else {
        toast.success('OTP Verified!', 'Please set your new password.')
        navigate('/reset-password', { state: { email } })
      }
    } catch {
      toast.error('Verification Error', 'Could not verify code.')
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    toast.info('Code Resent', 'A new 6-digit verification code was sent.')
  }

  return { verifyOTP, resendCode, loading }
}
