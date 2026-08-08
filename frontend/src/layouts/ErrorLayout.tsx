// ============================================================
// Error Layout
// ============================================================

import { Outlet, Link } from 'react-router-dom'
import { APP_NAME } from '@/constants'

export function ErrorLayout() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-green to-accent-blue
                          flex items-center justify-center text-bg-primary font-bold text-sm">
            K
          </div>
          <span className="text-text-primary font-semibold">{APP_NAME}</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <Outlet />
      </div>
    </div>
  )
}
