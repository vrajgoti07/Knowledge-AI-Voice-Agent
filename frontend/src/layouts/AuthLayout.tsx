// ============================================================
// AuthLayout — Full Screen Container for Auth Portal Pages
// ============================================================

import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 overflow-x-hidden">
      <Outlet />
    </div>
  )
}
