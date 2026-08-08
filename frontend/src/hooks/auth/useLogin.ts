// ============================================================
// useLogin Hook — Real API Integration with FastAPI /auth/login
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/uiStore'
import { apiPost } from '@/services/api'
import { ROUTES } from '@/constants'
import type { LoginCredentials, User } from '@/types'

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({})
  const { login: storeLogin } = useAuthStore()
  const navigate = useNavigate()

  const validate = (data: LoginCredentials): boolean => {
    const errs: Partial<LoginCredentials> = {}
    if (!data.email) {
      errs.email = 'Email address is required'
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errs.email = 'Enter a valid email address'
    }

    if (!data.password) {
      errs.password = 'Password is required'
    } else if (data.password.length < 6) {
      errs.password = 'Password must be at least 6 characters'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const login = async (data: LoginCredentials) => {
    if (!validate(data)) return

    setLoading(true)
    try {
      const response = await Promise.race([
        apiPost<{ user: User; token: string; refreshToken: string }>('/auth/login', {
          email: data.email,
          password: data.password,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SERVER_TIMEOUT')), 12000)
        ),
      ])

      storeLogin(response.user, response.token)
      toast.success('Welcome Back!', `Logged in as ${response.user.name}`)
      navigate(response.user.role === 'admin' ? ROUTES.ADMIN : ROUTES.DASHBOARD)
    } catch (err: any) {
      const isTimeout = err.message === 'SERVER_TIMEOUT' || err.code === 'ECONNABORTED'
      const detail = isTimeout
        ? 'Backend server is not responding. Please make sure it is running.'
        : err.response?.data?.detail || err.message || 'Invalid email or password'
      toast.error('Login Failed', detail)
      setErrors({ email: detail })
    } finally {
      setLoading(false)
    }
  }

  return { login, loading, errors }
}
