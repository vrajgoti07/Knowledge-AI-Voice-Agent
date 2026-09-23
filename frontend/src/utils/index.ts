// ============================================================
// Utility Functions — Khnowlge AI
// ============================================================

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ── Class Merging ─────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Formatting ────────────────────────────────────────────
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k    = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i    = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now   = Date.now()
  const then  = new Date(date).getTime()
  const delta = now - then
  const s     = Math.floor(delta / 1000)

  if (s < 60)        return 'just now'
  if (s < 3600)      return `${Math.floor(s / 60)}m ago`
  if (s < 86400)     return `${Math.floor(s / 3600)}h ago`
  if (s < 2592000)   return `${Math.floor(s / 86400)}d ago`
  if (s < 31536000)  return `${Math.floor(s / 2592000)}mo ago`
  return `${Math.floor(s / 31536000)}y ago`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

// ── String Utils ──────────────────────────────────────────
export function truncate(str: string, max: number, suffix = '…'): string {
  if (str.length <= max) return str
  return str.slice(0, max - suffix.length) + suffix
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function highlightMatch(text: string, query: string): string {
  if (!query) return text
  const regex  = new RegExp(`(${escapeRegex(query)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── Array Utils ───────────────────────────────────────────
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const group = String(item[key])
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})
}

export function unique<T>(arr: T[], key?: keyof T): T[] {
  if (!key) return [...new Set(arr)]
  const seen = new Set<unknown>()
  return arr.filter(item => {
    const val = item[key]
    if (seen.has(val)) return false
    seen.add(val)
    return true
  })
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

// ── Object Utils ──────────────────────────────────────────
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(k => delete result[k])
  return result
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce<Pick<T, K>>((acc, k) => {
    acc[k] = obj[k]
    return acc
  }, {} as Pick<T, K>)
}

// ── Debounce / Throttle ───────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => { inThrottle = false }, limit)
    }
  }
}

// ── Color Utils ───────────────────────────────────────────
export function hexToRgba(hex: string, alpha = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ── Random ────────────────────────────────────────────────
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ── Storage (Session vs Local Auth Persistence) ─────────────────
export const storage = {
  get<T>(key: string, fallback?: T): T | undefined {
    try {
      const item = sessionStorage.getItem(key) ?? localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : fallback
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown, persistent = false): void {
    try {
      const str = JSON.stringify(value)
      if (persistent) {
        localStorage.setItem(key, str)
      } else {
        sessionStorage.setItem(key, str)
      }
      // Also sync to localStorage for theme/preferences if needed
      if (key.includes('theme') || key.includes('prefs')) {
        localStorage.setItem(key, str)
      }
    } catch {
      /* noop */
    }
  },
  remove(key: string): void {
    try {
      sessionStorage.removeItem(key)
      localStorage.removeItem(key)
    } catch {
      /* noop */
    }
  },
  clear(): void {
    try {
      sessionStorage.clear()
      localStorage.clear()
    } catch {
      /* noop */
    }
  },
}

// ── File Utils ────────────────────────────────────────────
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export function getMimeIcon(mime: string): string {
  if (mime.includes('pdf'))   return 'FileType'
  if (mime.includes('word'))  return 'FileText'
  if (mime.includes('sheet')) return 'Sheet'
  if (mime.includes('text'))  return 'FileCode'
  if (mime.includes('image')) return 'Image'
  return 'File'
}

// ── Async Utils ───────────────────────────────────────────
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (retries <= 0) throw err
    await sleep(delay)
    return retry(fn, retries - 1, delay * 2)
  }
}

// ── URL Utils ─────────────────────────────────────────────
export function buildQueryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, String(v))
  })
  const str = qs.toString()
  return str ? `?${str}` : ''
}
