// ============================================================
// AuthLayout — Full Screen Container for Auth Portal Pages
// ============================================================

import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-[#0A0E1A] overflow-hidden">
      <Outlet />
    </div>
  )
}
