// ============================================================
// CommandPalette — Ctrl+K global search
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, LayoutDashboard, Brain, MessageSquare, FileText,
  Mic, History, BarChart3, Settings, User, Plus, Zap, X,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/utils'
import { backdropVariants, modalVariants } from '@/animations/variants'
import { ROUTES } from '@/constants'

interface CommandItemDef {
  id:       string
  label:    string
  icon:     React.ComponentType<{ className?: string }>
  href:     string
  group:    string
  shortcut?:string
}

const COMMANDS: CommandItemDef[] = [
  // Navigation
  { id: 'dashboard',    label: 'Dashboard',     icon: LayoutDashboard, href: ROUTES.DASHBOARD,     group: 'Navigation' },
  { id: 'chat',         label: 'New Chat',       icon: MessageSquare,    href: ROUTES.CHAT,           group: 'Navigation', shortcut: '⌘N' },
  { id: 'voice',        label: 'Voice Mode',     icon: Mic,              href: ROUTES.VOICE,          group: 'Navigation', shortcut: '⌘V' },
  { id: 'history',      label: 'History',        icon: History,          href: ROUTES.HISTORY,        group: 'Navigation' },
  { id: 'admin',        label: 'Admin Panel',    icon: BarChart3,        href: ROUTES.ADMIN,          group: 'Navigation' },
  // Settings
  { id: 'profile',      label: 'Profile',        icon: User,             href: ROUTES.PROFILE,        group: 'Settings' },
  { id: 'settings',     label: 'Settings',       icon: Settings,         href: ROUTES.SETTINGS,       group: 'Settings' },
]

const GROUPS = ['Navigation', 'Settings']

export function CommandPalette() {
  const { commandOpen, closeCommand } = useUIStore()
  const navigate = useNavigate()
  const [query, setQuery]     = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounced = useDebounce(query, 100)

  // Focus input on open
  useEffect(() => {
    if (commandOpen) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandOpen])

  // Filter commands
  const filtered = debounced
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(debounced.toLowerCase()) ||
        c.group.toLowerCase().includes(debounced.toLowerCase())
      )
    : COMMANDS

  // Keyboard navigation
  useEffect(() => {
    if (!commandOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')    { closeCommand(); return }
      if (e.key === 'ArrowDown') { setSelected(s => Math.min(s + 1, filtered.length - 1)); e.preventDefault() }
      if (e.key === 'ArrowUp')   { setSelected(s => Math.max(s - 1, 0)); e.preventDefault() }
      if (e.key === 'Enter') {
        const item = filtered[selected]
        if (item) { navigate(item.href); closeCommand() }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commandOpen, filtered, selected, closeCommand, navigate])

  return (
    <AnimatePresence>
      {commandOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={closeCommand}
            className="fixed inset-0 z-50 bg-bg-primary/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            key="palette"
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed top-[20vh] left-1/2 -translate-x-1/2 z-50
                       w-full max-w-[560px] mx-4"
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
          >
            <div className="card-elevated rounded-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-border/60">
                <Search className="w-4 h-4 text-text-muted shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search pages, documents, commands..."
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(0) }}
                  className="flex-1 bg-transparent text-text-primary text-sm outline-none
                             placeholder:text-text-muted"
                  aria-label="Search"
                />
                {query && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuery('')}
                    className="btn-icon btn-ghost w-6 h-6"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5 text-text-muted" />
                  </motion.button>
                )}
                <kbd className="text-[10px] px-1.5 py-1 rounded-md bg-bg-primary border border-border/60
                                font-mono text-text-muted">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin p-2">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="w-8 h-8 text-text-muted mb-3 opacity-40" />
                    <p className="text-text-muted text-sm">No results for "{query}"</p>
                    <p className="text-text-muted text-xs mt-1 opacity-60">Try a different term</p>
                  </div>
                ) : (
                  GROUPS.map(group => {
                    const items = filtered.filter(c => c.group === group)
                    if (!items.length) return null
                    return (
                      <div key={group} className="mb-2">
                        <p className="label-mono px-3 py-1.5">{group}</p>
                        {items.map(item => {
                          const Icon   = item.icon
                          const idx    = filtered.indexOf(item)
                          const active = idx === selected
                          return (
                            <motion.button
                              key={item.id}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => { navigate(item.href); closeCommand() }}
                              onMouseEnter={() => setSelected(idx)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
                                'transition-all duration-100 text-left',
                                active
                                  ? 'bg-accent-blue/10 text-accent-blue'
                                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                              )}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="flex-1">{item.label}</span>
                              {item.shortcut && (
                                <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-bg-primary
                                                border border-border/60 font-mono text-text-muted">
                                  {item.shortcut}
                                </kbd>
                              )}
                            </motion.button>
                          )
                        })}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border/60 bg-bg-elevated/50">
                <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <kbd className="font-mono px-1 py-0.5 rounded bg-bg-primary border border-border/60">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <kbd className="font-mono px-1 py-0.5 rounded bg-bg-primary border border-border/60">↵</kbd>
                  Open
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <kbd className="font-mono px-1 py-0.5 rounded bg-bg-primary border border-border/60">ESC</kbd>
                  Close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
