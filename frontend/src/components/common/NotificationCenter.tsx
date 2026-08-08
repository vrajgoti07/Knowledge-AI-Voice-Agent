// ============================================================
// NotificationCenter — Categorized Notifications Panel
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Check, Trash2, Shield, Sparkles, FileText,
  MessageSquare, Cpu, CheckCheck, Filter
} from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { cn } from '@/utils'

export interface NotificationItem {
  id: string
  category: 'system' | 'ai' | 'documents' | 'messages' | 'security'
  title: string
  description: string
  timestamp: string
  unread: boolean
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    category: 'ai',
    title: 'RAG Model Indexing Complete',
    description: 'Vector store finished embedding "Transformer_Architecture.pdf" (1,240 chunks).',
    timestamp: '5m ago',
    unread: true,
  },
  {
    id: 'n-2',
    category: 'documents',
    title: 'New Document Uploaded',
    description: 'Alex uploaded "Q3_Research_Report.docx" to Knowledge Hub.',
    timestamp: '25m ago',
    unread: true,
  },
  {
    id: 'n-3',
    category: 'security',
    title: 'New Device Session Detected',
    description: 'Signed in from Chrome on Windows 11 (Mumbai, India).',
    timestamp: '2h ago',
    unread: false,
  },
  {
    id: 'n-4',
    category: 'system',
    title: 'System Maintenance Scheduled',
    description: 'Vector database optimization scheduled for Sunday 02:00 UTC.',
    timestamp: '1d ago',
    unread: false,
  },
]

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState<'all' | 'unread' | 'ai' | 'documents'>('all')

  const unreadCount = notifications.filter(n => n.unread).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return n.unread
    if (filter === 'ai') return n.category === 'ai'
    if (filter === 'documents') return n.category === 'documents'
    return true
  })

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn-icon btn-ghost relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-text-muted hover:text-text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-green ring-2 ring-bg-secondary animate-pulse" />
          )}
        </motion.button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 sm:w-96 card p-0 shadow-2xl border border-border/80 rounded-2xl overflow-hidden animate-scale-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-bg-secondary/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-text-primary">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-accent-blue/20 text-accent-blue text-[10px] font-mono font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-accent-blue hover:underline font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[11px] text-text-muted hover:text-danger font-medium ml-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border/40 bg-bg-elevated/40 text-[11px]">
            <Filter className="w-3 h-3 text-text-muted mr-1" />
            {(['all', 'unread', 'ai', 'documents'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-2 py-0.5 rounded-lg capitalize font-medium transition-colors',
                  filter === f
                    ? 'bg-accent-blue/15 text-accent-blue font-semibold'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-xs">
                No notifications found.
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'p-3 flex items-start gap-3 hover:bg-bg-elevated/50 transition-colors group relative',
                    item.unread && 'bg-accent-blue/5'
                  )}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-bg-elevated shrink-0">
                    {item.category === 'ai' && <Sparkles className="w-3.5 h-3.5 text-accent-blue" />}
                    {item.category === 'documents' && <FileText className="w-3.5 h-3.5 text-accent-green" />}
                    {item.category === 'security' && <Shield className="w-3.5 h-3.5 text-warning" />}
                    {item.category === 'system' && <Cpu className="w-3.5 h-3.5 text-purple-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-xs truncate font-medium", item.unread ? 'text-text-primary font-semibold' : 'text-text-secondary')}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-text-muted font-mono shrink-0">{item.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteNotification(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-danger transition-opacity rounded"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
