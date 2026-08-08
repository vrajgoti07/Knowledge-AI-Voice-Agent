// ============================================================
// Auth Store — Real Backend Authentication (No Demo Hardcoded Accounts)
// Single source of truth connected to FastAPI POST /auth/login & GET /auth/me
// ============================================================

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, AuthState } from '@/types'
import { STORAGE_KEYS } from '@/constants'
import { storage } from '@/utils'
import { apiGet } from '@/services/api'

interface AuthStore extends AuthState {
  setUser:        (user: User) => void
  setToken:       (token: string) => void
  login:          (user: User, token: string) => void
  logout:         () => void
  setLoading:     (loading: boolean) => void
  checkAuth:      () => Promise<boolean>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      isLoading:       false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setToken: (token) => {
        storage.set(STORAGE_KEYS.AUTH_TOKEN, token)
        set({ token })
      },

      login: (user, token) => {
        storage.set(STORAGE_KEYS.AUTH_TOKEN, token)
        set({ user, token, isAuthenticated: true })
      },

      setLoading: (isLoading) => set({ isLoading }),

      checkAuth: async () => {
        const currentToken = get().token || storage.get<string>(STORAGE_KEYS.AUTH_TOKEN)
        if (!currentToken) {
          get().logout()
          return false
        }

        try {
          // Race against 8s timeout so a hung backend never freezes the UI
          const user = await Promise.race([
            apiGet<User>('/auth/me'),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Auth check timed out')), 8000)
            ),
          ])
          set({ user, isAuthenticated: true })
          return true
        } catch (err) {
          get().logout()
          return false
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        storage.remove(STORAGE_KEYS.AUTH_TOKEN)
        storage.remove('knowledge:last_dashboard_route')
        try {
          sessionStorage.removeItem('knowledge-ai-real-auth')
          sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
          localStorage.removeItem('knowledge-ai-real-auth')
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        } catch {
          /* noop */
        }
      },
    }),
    {
      name: 'knowledge-ai-real-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
