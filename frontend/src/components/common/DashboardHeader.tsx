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
    <header className="h-16 px-6 sm:px-8 border-b border-white/[0.08] bg-[#0D1220]/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between gap-4 shrink-0 text-[#F1F5F9] select-none shadow-xs">
      {/* Dynamic Context Breadcrumb (Left) */}
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
        <span className="text-[#64748B]">Workspace</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
        <span className="text-[#F1F5F9] font-semibold tracking-tight">{currentTitle}</span>
      </div>

      {/* Center / Right: Global Cmd+K Search Box & Voice Agent Online Status */}
      <div className="flex items-center gap-3.5">
        {/* Global Cmd+K Search Box */}
        <button
          type="button"
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
            window.dispatchEvent(event)
          }}
          className="w-52 sm:w-72 h-9 rounded-xl bg-white/[0.03] border border-white/10 px-3 flex items-center justify-between text-xs text-[#94A3B8] hover:border-[#38BDF8]/50 hover:text-[#F1F5F9] hover:bg-white/[0.06] hover:shadow-[0_0_16px_rgba(56,189,248,0.12)] transition-all cursor-pointer shadow-xs group active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search className="w-3.5 h-3.5 text-[#60A5FA] group-hover:text-[#38BDF8] transition-colors shrink-0" />
            <span className="truncate">Search documents & chats...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 text-[10px] font-mono font-semibold text-[#94A3B8] group-hover:text-white shrink-0 shadow-xs">
            ⌘K
          </kbd>
        </button>

        {/* Persistent Voice Agent Status Dot */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 shrink-0 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="text-[11px] font-semibold">Voice Agent: Online</span>
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.06] transition-all cursor-pointer border border-transparent hover:border-white/10"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#38BDF8] ring-2 ring-[#0D1220]" />
        </button>
      </div>
    </header>
  )
}
