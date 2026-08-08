// ============================================================
// PublicHeader — Full-Width Edge-to-Edge Navbar
// Logo Far-Left, Action Buttons Far-Right, Center Nav Items
// All nav links use smooth scrollIntoView — no broken anchors
// ============================================================

import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useAuthStore } from '@/store/authStore'
import { cn, storage } from '@/utils'
import { APP_NAME, ROUTES } from '@/constants'
import { AppLogo } from '@/components/common/AppLogo'

// ── Smooth scroll helper ──────────────────────────────────────
function scrollTo(id: string, closeMobile?: () => void) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  closeMobile?.()
}

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const lastDashboardRoute = storage.get<string>('knowledge:last_dashboard_route') || ROUTES.DASHBOARD

  const closeMobile = () => setMobileOpen(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0E1A]/95 backdrop-blur-xl border-b border-[#1E293B] h-16 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Logo Far-Left */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <AppLogo className="w-7 h-7 text-[#38BDF8] group-hover:scale-105 transition-transform" />
            <span className="text-[#F1F5F9] font-bold text-base tracking-tight group-hover:text-[#38BDF8] transition-colors">
              {APP_NAME}
            </span>
          </Link>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center justify-center flex-1 gap-1 lg:gap-1.5 px-2">
            {/* Home */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  'px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-colors',
                  isActive ? 'text-[#F1F5F9] bg-[#121A2C]' : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121A2C]'
                )
              }
            >
              Home
            </NavLink>

            {/* Features */}
            <button
              type="button"
              onClick={() => scrollTo('features')}
              className="px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121A2C] transition-colors cursor-pointer"
            >
              Features
            </button>

            {/* Solutions Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121A2C] transition-colors cursor-pointer outline-none">
                  <span>Solutions</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="start" sideOffset={8} className="z-50 min-w-[200px] p-1.5 rounded-xl bg-[#121A2C] border border-[#1E293B] shadow-2xl space-y-0.5 text-[#F1F5F9]">
                  <DropdownMenu.Item
                    className="px-3 py-2 rounded-lg text-xs font-medium text-[#F1F5F9] hover:bg-[#16213A] cursor-pointer outline-none"
                    onSelect={() => scrollTo('solutions')}
                  >
                    Academic Research
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="px-3 py-2 rounded-lg text-xs font-medium text-[#F1F5F9] hover:bg-[#16213A] cursor-pointer outline-none"
                    onSelect={() => scrollTo('solutions')}
                  >
                    Enterprise Engineering
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="px-3 py-2 rounded-lg text-xs font-medium text-[#F1F5F9] hover:bg-[#16213A] cursor-pointer outline-none"
                    onSelect={() => scrollTo('solutions')}
                  >
                    Knowledge Base RAG
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Pricing */}
            <button
              type="button"
              onClick={() => scrollTo('pricing')}
              className="px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121A2C] transition-colors cursor-pointer"
            >
              Pricing
            </button>

            {/* Resources Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121A2C] transition-colors cursor-pointer outline-none">
                  <span>Resources</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="start" sideOffset={8} className="z-50 min-w-[200px] p-1.5 rounded-xl bg-[#121A2C] border border-[#1E293B] shadow-2xl space-y-0.5 text-[#F1F5F9]">
                  <DropdownMenu.Item
                    className="px-3 py-2 rounded-lg text-xs font-medium text-[#F1F5F9] hover:bg-[#16213A] cursor-pointer outline-none"
                    onSelect={() => scrollTo('about')}
                  >
                    Documentation &amp; API
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="px-3 py-2 rounded-lg text-xs font-medium text-[#F1F5F9] hover:bg-[#16213A] cursor-pointer outline-none"
                    onSelect={() => scrollTo('about')}
                  >
                    Community &amp; Guides
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="px-3 py-2 rounded-lg text-xs font-medium text-[#F1F5F9] hover:bg-[#16213A] cursor-pointer outline-none"
                    onSelect={() => scrollTo('about')}
                  >
                    Release Notes v2.5
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* About */}
            <button
              type="button"
              onClick={() => scrollTo('about')}
              className="px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121A2C] transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {isAuthenticated ? (
              <Link to={lastDashboardRoute}>
                <button className="h-9 px-4 rounded-full bg-gradient-to-r from-[#38BDF8] to-[#3B82F6] hover:from-[#60A5FA] hover:to-[#2563EB] text-[#0F172A] font-semibold text-xs lg:text-sm tracking-wide shadow-[0_2px_12px_rgba(56,189,248,0.35)] transition-all cursor-pointer flex items-center gap-2">
                  Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link to={ROUTES.LOGIN} className="hidden sm:inline-block">
                  <button className="h-9 px-4 rounded-full bg-[#121A2C] border border-[#1E293B] hover:border-[#38BDF8]/40 hover:bg-[#16213A] text-[#F1F5F9] font-semibold text-xs lg:text-sm transition-all cursor-pointer">
                    Sign In
                  </button>
                </Link>

                <Link to={ROUTES.REGISTER}>
                  <button className="h-9 px-4 rounded-full bg-gradient-to-r from-[#38BDF8] to-[#3B82F6] hover:from-[#60A5FA] hover:to-[#2563EB] text-[#0F172A] font-semibold text-xs lg:text-sm tracking-wide shadow-[0_2px_12px_rgba(56,189,248,0.35)] hover:shadow-[0_4px_18px_rgba(56,189,248,0.5)] transition-all cursor-pointer flex items-center justify-center active:scale-[0.98]">
                    <span>Get Started Free</span>
                  </button>
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121A2C] md:hidden cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0A0E1A] border-b border-[#1E293B] px-5 py-4 space-y-1"
          >
            <NavLink to="/" onClick={closeMobile} className="block px-3 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:bg-[#121A2C] hover:text-[#F1F5F9]">
              Home
            </NavLink>
            <button
              type="button"
              onClick={() => scrollTo('features', closeMobile)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:bg-[#121A2C] hover:text-[#F1F5F9] cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollTo('solutions', closeMobile)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:bg-[#121A2C] hover:text-[#F1F5F9] cursor-pointer"
            >
              Solutions
            </button>
            <button
              type="button"
              onClick={() => scrollTo('pricing', closeMobile)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:bg-[#121A2C] hover:text-[#F1F5F9] cursor-pointer"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollTo('about', closeMobile)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:bg-[#121A2C] hover:text-[#F1F5F9] cursor-pointer"
            >
              About
            </button>

            <div className="pt-3 border-t border-[#1E293B] flex flex-col gap-2">
              {!isAuthenticated && (
                <>
                  <Link to={ROUTES.LOGIN} onClick={closeMobile}>
                    <button className="w-full h-9 rounded-full bg-[#121A2C] border border-[#1E293B] text-[#F1F5F9] font-semibold text-xs sm:text-sm">
                      Sign In
                    </button>
                  </Link>
                  <Link to={ROUTES.REGISTER} onClick={closeMobile}>
                    <button className="w-full h-9 rounded-full bg-[#38BDF8] text-[#0F172A] font-semibold text-xs sm:text-sm flex items-center justify-center">
                      <span>Get Started Free</span>
                    </button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
