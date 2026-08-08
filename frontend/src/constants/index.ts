// ============================================================
// App Constants — Knowledge AI
// ============================================================

export const APP_NAME = 'Knowledge AI'
export const APP_TAGLINE = 'Unified access to all your team\'s knowledge, documents, and data.'
export const APP_DESCRIPTION =
  'Unified knowledge network searchable, understandable, and collaborative powered by Gemini 2.5 Flash & Hybrid RAG.'
export const APP_VERSION = '2.4.0'

// ── Canonical Routes ──────────────────────────────────────
export const ROUTES = {
  // Public & Marketing
  HOME:            '/',
  LOGIN:           '/login',
  REGISTER:        '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD:  '/reset-password',
  OTP_VERIFICATION:'/otp-verification',
  ACCOUNT_VERIFIED:'/account-verified',

  // Protected User Routes (6 Primary Prompt Sidebar Items)
  DASHBOARD:       '/dashboard',
  PROJECTS:        '/projects',
  KNOWLEDGE_BASE:  '/dashboard',
  VOICE:           '/voice',
  PERSONAL_LIBRARY:'/personal-library',
  SETTINGS:        '/settings',
  PROFILE:         '/settings?tab=profile',

  // Additional User Sub-routes
  CHAT:            '/chat',
  DOCUMENTS:       '/dashboard',
  KNOWLEDGE_HUB:   '/dashboard',
  HISTORY:         '/history',

  // Protected Admin Routes (7 Primary Prompt Sidebar Items)
  ADMIN:               '/admin',
  ADMIN_MODELS:        '/admin/models',
  ADMIN_DATASETS:      '/admin/datasets',
  ADMIN_USERS:         '/admin/users',
  ADMIN_SYSTEM_HEALTH: '/admin/system-health',
  ADMIN_LOGS:          '/admin/logs',
  ADMIN_SETTINGS:      '/admin/settings',

  // Errors
  NOT_FOUND:       '/404',
  UNAUTHORIZED:    '/401',
} as const

// ── Config ──────────────────────────────────────────
export const API_BASE_URL   = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000/api/v1'
export const WS_BASE_URL    = (import.meta as any).env?.VITE_WS_URL  ?? 'ws://localhost:8000/ws'
export const API_TIMEOUT    = 120_000

export const STORAGE_KEYS = {
  AUTH_TOKEN:      'knowledge:token',
  THEME:           'knowledge:theme',
  SIDEBAR_STATE:   'knowledge:sidebar',
  PREFERENCES:     'knowledge:prefs',
} as const
