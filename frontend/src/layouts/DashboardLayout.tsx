// ============================================================
// DashboardLayout — Ultra-Clean 100vh Locked User Workspace Layout (#0B1120 BG)
// Fixed 250px Left Sidebar + Minimal Top Header + Scrollable Workspace Content
// Full-Bleed 100% Height for /chat route (removes outer padding & extra right scrollbar)
// ============================================================

import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AppSidebar }       from '@/components/common/AppSidebar'
import { DashboardHeader }  from '@/components/common/DashboardHeader'
import { CommandPalette }   from '@/components/common/CommandPalette'
import { QuickUploadModal } from '@/components/common/QuickUploadModal'
import { VoiceModal }        from '@/components/common/VoiceModal'
import { pageVariants }     from '@/animations/variants'
import { storage }          from '@/utils'

export function DashboardLayout() {
  const location = useLocation()
  const isFullBleedPage = location.pathname.startsWith('/chat') || location.pathname.startsWith('/voice')

  useEffect(() => {
    if (location.pathname && !location.pathname.startsWith('/auth') && location.pathname !== '/') {
      storage.set('knowledge:last_dashboard_route', location.pathname)
    }
  }, [location.pathname])

  return (
    <div className="h-screen w-screen flex flex-row overflow-hidden bg-[#0B1120] text-[#F1F5F9] select-none">
      {/* ── 1. FIXED LEFT SIDEBAR (250px Width, Full Height 100vh) ── */}
      <AppSidebar />

      {/* ── 2. FLUID RIGHT PANEL (Header + Workspace Content Area) ── */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
        {/* Minimal Top Header with Breadcrumbs & Cmd+K Search */}
        <DashboardHeader />

        {/* Workspace Area: Full-bleed h-full for /chat & /voice, padded scrollable for dashboard/settings */}
        {isFullBleedPage ? (
          <main className="flex-1 flex flex-col h-full w-full min-w-0 overflow-hidden relative p-0 m-0">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-6 sm:p-8 scrollbar-thin">
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
        )}
      </div>

      {/* Overlays & Modals */}
      <CommandPalette />
      <QuickUploadModal />
      <VoiceModal />
    </div>
  )
}
