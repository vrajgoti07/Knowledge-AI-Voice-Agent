import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { storage } from '@/utils'

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const lastDashboardRoute = storage.get<string>('knowledge:last_dashboard_route') || '/dashboard'

  if (isAuthenticated) return <Navigate to={lastDashboardRoute} replace />
  return <>{children}</>
}
