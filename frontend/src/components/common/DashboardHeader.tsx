// ============================================================
// DashboardHeader — Minimal User Top Navbar (#0B1120 BG)
// Dynamic Context Breadcrumbs + Cmd+K Search + "Voice Agent: Online" Status
// ============================================================

import React from 'react'
import { useLocation } from 'react-router-dom'
import { Search, ChevronRight, Bell } from 'lucide-react'

const USER_BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'My Dashboard',
  '/projects': 'My Projects',
  '/knowledgebase': 'Knowledge Base',
  '/documents': 'Knowledge Base',
  '/voice': 'Voice Assistant',
  '/personal-library': 'Personal Library',
  '/settings': 'Settings',
  '/history': 'History',
  '/chat': 'Chat',
}

export function DashboardHeader() {
  const location = useLocation()
  const currentTitle = USER_BREADCRUMB_MAP[location.pathname] || 'AI Chat'

  return (
    <header className="h-16 px-8 border-b border-white/10 bg-[#0B1120] sticky top-0 z-30 flex items-center justify-between gap-4 shrink-0 text-[#F1F5F9] select-none">
      {/* Dynamic Context Breadcrumb (Left) */}
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
        <span className="text-[#64748B]">Workspace</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
        <span className="text-[#F1F5F9] font-semibold">{currentTitle}</span>
      </div>

      {/* Center / Right: Global Cmd+K Search Box & Voice Agent Online Status */}
      <div className="flex items-center gap-4">
        {/* Global Cmd+K Search Box */}
        <button
          type="button"
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
            window.dispatchEvent(event)
          }}
          className="w-56 sm:w-72 h-9 rounded-xl bg-[#121A2C] border border-white/10 px-3 flex items-center justify-between text-xs text-[#94A3B8] hover:border-[#38BDF8]/40 hover:text-[#F1F5F9] transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-[#60A5FA] group-hover:text-[#38BDF8] transition-colors shrink-0" />
            <span className="truncate">Search documents & chats...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-mono font-semibold text-[#94A3B8] group-hover:text-white shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* Persistent Voice Agent Status Dot */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121A2C] border border-white/10 text-xs font-mono text-[#38BDF8] shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-[11px]">Voice Agent: Online</span>
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.04] transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#38BDF8] ring-2 ring-[#0B1120]" />
        </button>
      </div>
    </header>
  )
}
