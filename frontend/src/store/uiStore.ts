// ============================================================
// UI Store — Zustand (sidebar, command palette, theme, toasts)
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Toast, ToastType, SidebarState } from '@/types'
import { generateId } from '@/utils'

interface UIStore {
  // Sidebar
  sidebar: SidebarState
  toggleSidebar:   ()               => void
  collapseSidebar: ()               => void
  expandSidebar:   ()               => void
  setSidebarPinned:(pinned: boolean)=> void

  // Command Palette
  commandOpen: boolean
  openCommand: ()  => void
  closeCommand:()  => void

  // Toasts
  toasts:     Toast[]
  addToast:   (toast: Omit<Toast, 'id'>) => void
  removeToast:(id: string)               => void
  clearToasts:()                         => void

  // Theme
  theme: 'dark' | 'light'
  toggleTheme:()=> void

  // Mobile nav
  mobileNavOpen: boolean
  setMobileNavOpen:(open: boolean)=> void

  // Modals & Drawers
  uploadModalOpen: boolean
  setUploadModalOpen: (open: boolean) => void
  voiceModalOpen: boolean
  setVoiceModalOpen: (open: boolean) => void
  notificationsOpen: boolean
  setNotificationsOpen: (open: boolean) => void

  // Active Workspace
  activeWorkspace: string
  setActiveWorkspace: (ws: string) => void

  // Active page title
  pageTitle: string
  setPageTitle:(title: string)=> void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // ── Sidebar ─────────────────────────────────────────
      sidebar: {
        isOpen:     true,
        isCollapsed:false,
        isPinned:   true,
        width:      260,
      },

      toggleSidebar: () => {
        const { sidebar } = get()
        set({ sidebar: { ...sidebar, isOpen: !sidebar.isOpen } })
      },

      collapseSidebar: () => {
        const { sidebar } = get()
        set({ sidebar: { ...sidebar, isCollapsed: true, width: 68 } })
      },

      expandSidebar: () => {
        const { sidebar } = get()
        set({ sidebar: { ...sidebar, isCollapsed: false, width: 260 } })
      },

      setSidebarPinned: (pinned) => {
        const { sidebar } = get()
        set({ sidebar: { ...sidebar, isPinned: pinned } })
      },

      // ── Command Palette ──────────────────────────────────
      commandOpen: false,
      openCommand: () => set({ commandOpen: true }),
      closeCommand:() => set({ commandOpen: false }),

      // ── Toasts ───────────────────────────────────────────
      toasts: [],

      addToast: (toast) => {
        const id = generateId('toast')
        const newToast: Toast = { id, duration: 4000, ...toast }
        set(state => ({ toasts: [...state.toasts, newToast] }))
        setTimeout(() => {
          get().removeToast(id)
        }, newToast.duration)
      },

      removeToast: (id) => {
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
      },

      clearToasts: () => set({ toasts: [] }),

      // ── Theme ─────────────────────────────────────────────
      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        document.documentElement.classList.toggle('dark', next === 'dark')
        document.documentElement.classList.toggle('light', next === 'light')
      },

      // ── Mobile ────────────────────────────────────────────
      mobileNavOpen: false,
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

      // ── Modals & Drawers ─────────────────────────────────
      uploadModalOpen: false,
      setUploadModalOpen: (open) => set({ uploadModalOpen: open }),
      voiceModalOpen: false,
      setVoiceModalOpen: (open) => set({ voiceModalOpen: open }),
      notificationsOpen: false,
      setNotificationsOpen: (open) => set({ notificationsOpen: open }),

      // ── Workspace ─────────────────────────────────────────
      activeWorkspace: 'Personal Workspace',
      setActiveWorkspace: (ws) => set({ activeWorkspace: ws }),

      // ── Page Title ────────────────────────────────────────
      pageTitle: 'Dashboard',
      setPageTitle: (title) => set({ pageTitle: title }),
    }),
    {
      name:       'khnowlge-ui',
      partialize: (state) => ({
        sidebar: state.sidebar,
        theme:   state.theme,
      }),
    }
  )
)

// ── Toast helpers ─────────────────────────────────────────
export const toast = {
  success: (title: string, description?: string) =>
    useUIStore.getState().addToast({ type: 'success' as ToastType, title, description }),
  error: (title: string, description?: string) =>
    useUIStore.getState().addToast({ type: 'error' as ToastType, title, description }),
  warning: (title: string, description?: string) =>
    useUIStore.getState().addToast({ type: 'warning' as ToastType, title, description }),
  info: (title: string, description?: string) =>
    useUIStore.getState().addToast({ type: 'info' as ToastType, title, description }),
}
