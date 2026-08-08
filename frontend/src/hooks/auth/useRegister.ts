// ============================================================
// useRegister Hook — Registration Form handling
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/store/uiStore'
import { ROUTES } from '@/constants'
import type { RegisterData } from '@/types'

export function useRegister() {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterData | 'terms', string>>>({})
  const navigate = useNavigate()

  const validate = (data: RegisterData, termsAccepted: boolean): boolean => {
    const errs: Partial<Record<keyof RegisterData | 'terms', string>> = {}

    if (!data.name.trim()) errs.name = 'Full name is required'
    if (!data.email.trim()) {
      errs.email = 'Email address is required'
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errs.email = 'Enter a valid email address'
    }

    if (!data.password) {
      errs.password = 'Password is required'
    } else if (data.password.length < 8) {
      errs.password = 'Password must be at least 8 characters'
    }

    if (data.confirmPassword !== data.password) {
      errs.confirmPassword = 'Passwords do not match'
    }

    if (!termsAccepted) {
      errs.terms = 'You must accept the Terms of Service & Privacy Policy'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const register = async (data: RegisterData, termsAccepted: boolean) => {
    if (!validate(data, termsAccepted)) return

    setLoading(true)
    try {
      await new Promise((res) => setTimeout(res, 1200))
      toast.success('Account Created!', 'Verification code sent to your email.')
      navigate('/otp-verification', { state: { email: data.email, action: 'register' } })
    } catch (err) {
      toast.error('Registration Failed', 'Could not create account. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return { register, loading, errors }
}
