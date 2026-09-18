import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, Folder, BookOpen, Mic, Bookmark, Settings,
  Cpu, Database, Users, Activity, LogOut, MessageSquare, Clock, History
} from 'lucide-react'
import { cn } from '@/utils'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants'
import { AppLogo } from '@/components/common/AppLogo'

interface NavItemDef {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const USER_NAV_ITEMS: NavItemDef[] = [
  { label: 'My Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'AI Chat', href: '/chat', icon: MessageSquare },
  { label: 'Voice Assistant', href: ROUTES.VOICE, icon: Mic },
  { label: 'My Projects', href: '/projects', icon: Folder },
  { label: 'Personal Library', href: '/personal-library', icon: Bookmark },
  { label: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
]


const ADMIN_NAV_ITEMS: NavItemDef[] = [
  { label: 'Overview', href: ROUTES.ADMIN, icon: LayoutDashboard },
  { label: 'AI Models', href: ROUTES.ADMIN_MODELS, icon: Cpu },
  { label: 'Knowledge Base', href: ROUTES.ADMIN_DATASETS, icon: Database },
  { label: 'Users', href: ROUTES.ADMIN_USERS, icon: Users },
  { label: 'Monitoring', href: ROUTES.ADMIN_MONITORING, icon: Activity },
  { label: 'Settings', href: ROUTES.ADMIN_SETTINGS, icon: Settings },
]

export function AppSidebar() {
  const { user, logout } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS

  return (
    <aside className="w-[260px] h-screen flex flex-col justify-between bg-[#0B1120] border-r border-white/10 shrink-0 select-none text-[#F1F5F9] z-20">
      {/* Top Header & Navigation */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 bg-[#0B1120]">
          <Link to={isAdmin ? ROUTES.ADMIN : ROUTES.DASHBOARD} className="flex items-center gap-3">
            <AppLogo className="w-7 h-7 text-[#38BDF8]" />
            <span className="text-[#F1F5F9] font-bold text-base tracking-tight">Knowledge AI</span>
          </Link>
        </div>

        {/* Navigation Item List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === ROUTES.DASHBOARD || item.href === ROUTES.ADMIN}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-white/[0.06] text-white font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[#38BDF8] before:rounded-r'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.03]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-[#38BDF8]' : 'text-[#94A3B8] group-hover:text-[#F1F5F9]')} />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Sticky Bottom Section (Profile Row & Log Out Button) */}
      <div className="border-t border-white/10 p-3.5 space-y-3 bg-[#0B1120] shrink-0">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8.5 h-8.5 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-1 ring-white/10">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#F1F5F9] truncate">{user?.name ?? 'User'}</p>
              <p className="text-[10px] text-[#64748B] truncate">{user?.email ?? ''}</p>
            </div>
          </div>
          {isAdmin && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 shrink-0">
              Admin
            </span>
          )}
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  )
}
