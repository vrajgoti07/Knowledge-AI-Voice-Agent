// ============================================================
// App Providers — wraps all context providers
// ============================================================

import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { BackendStatusBanner } from '@/components/common/BackendStatusBanner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:       5 * 60 * 1000,   // 5min
      gcTime:          10 * 60 * 1000,  // 10min
      retry:           1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth)

  useEffect(() => {
    try {
      const hasSessionAuth =
        sessionStorage.getItem('knowledge-ai-real-auth') ||
        sessionStorage.getItem('knowledge:token')
      if (!hasSessionAuth) {
        localStorage.removeItem('knowledge-ai-real-auth')
        localStorage.removeItem('knowledge:token')
        localStorage.removeItem('knowledge:last_dashboard_route')
      }
    } catch {
      /* noop */
    }
    checkAuth()
  }, [checkAuth])

  return <>{children}</>
}

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <BackendStatusBanner />
      <AuthInitializer>{children}</AuthInitializer>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'glass border-border text-text-primary text-sm font-medium',
          duration: 4000,
        }}
        theme="dark"
      />
    </QueryClientProvider>
  )
}
