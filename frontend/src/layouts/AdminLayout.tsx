// ============================================================
// AdminLayout — Ultra-Clean Minimal 100vh Locked Admin Layout (#0B1120 BG)
// Fixed 260px Left Sidebar + Minimal AdminHeader + Scrollable Main Content (40px Padding)
// ============================================================

import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AppSidebar } from '@/components/common/AppSidebar'
import { AdminHeader } from '@/components/common/AdminHeader'
import { CommandPalette } from '@/components/common/CommandPalette'
import { pageVariants } from '@/animations/variants'

export function AdminLayout() {
  const location = useLocation()

  return (
    <div className="h-screen w-screen flex flex-row overflow-hidden bg-[#0B1120] text-[#F1F5F9] select-none">
      {/* ── 1. FIXED LEFT SIDEBAR (260px Width, Full Height 100vh) ── */}
      <AppSidebar />

      {/* ── 2. FLUID RIGHT PANEL (Header + Independent Scrollable Content Area) ── */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Minimal Top Header with Dynamic Breadcrumb & Cmd+K */}
        <AdminHeader />

        {/* Independent Scrollable Content Area (Generous 40px / p-8 lg:p-10 Padding) */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-10 scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-7xl mx-auto space-y-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Command Palette Modal */}
      <CommandPalette />
    </div>
  )
}
