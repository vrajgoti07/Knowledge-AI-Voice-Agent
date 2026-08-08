// ============================================================
// useHealthCheck — Periodic backend health ping
// Polls GET /api/v1/health every 30 seconds.
// Sets backendDown=true when unreachable, clears on recovery.
// Uses axios (apiGet) so the Vite proxy + auth interceptor work correctly.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '@/constants'

const POLL_INTERVAL_MS = 30_000             // 30 seconds
const FETCH_TIMEOUT_MS = 8_000              // 8-second per-probe timeout

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'unreachable'
  db:     boolean
  qdrant: boolean
  redis:  boolean
}

/**
 * Probes the backend health endpoint once.
 * Uses axios directly (NOT the apiGet helper) to avoid the auth interceptor
 * logging the user out on a failed health check.
 * Returns null on network error (backend unreachable).
 */
async function probeHealth(baseUrl: string): Promise<HealthStatus | null> {
  try {
    // Build the health URL — use relative path for local dev (Vite proxy),
    // absolute URL otherwise.
    const isLocalDev = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')
    const url = isLocalDev
      ? '/api/v1/health'
      : baseUrl.replace(/\/api\/v1$/, '') + '/api/v1/health'

    const res = await axios.get(url, {
      timeout: FETCH_TIMEOUT_MS,
      // Don't send auth headers — health is a public endpoint
      headers: { 'Accept': 'application/json' },
      validateStatus: (status) => status < 500, // 4xx is still "reachable"
    })

    if (res.status >= 200 && res.status < 300 && res.data) {
      return res.data as HealthStatus
    }

    // Backend responded (even with 4xx) — it's reachable but maybe degraded
    return { status: 'degraded', db: false, qdrant: false, redis: false }
  } catch {
    return null
  }
}

interface UseHealthCheckReturn {
  backendDown:  boolean
  health:       HealthStatus | null
  lastChecked:  Date | null
  checkNow:     () => Promise<void>
}

export function useHealthCheck(apiBaseUrl: string): UseHealthCheckReturn {
  const [backendDown, setBackendDown] = useState(false)
  const [health,      setHealth]      = useState<HealthStatus | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  // Track consecutive failures before flagging as "down" (avoids flap on single blip)
  const failCount = useRef(0)
  const MAX_FAILURES_BEFORE_BANNER = 2

  const checkNow = useCallback(async () => {
    const result = await probeHealth(apiBaseUrl)
    const now    = new Date()
    setLastChecked(now)

    if (result !== null) {
      // Server is reachable (even if degraded) — clear the unreachable banner
      failCount.current = 0
      setHealth(result)
      setBackendDown(false)
    } else {
      failCount.current += 1
      setHealth(null)
      // Only show the banner after N consecutive failures to avoid false positives
      if (failCount.current >= MAX_FAILURES_BEFORE_BANNER) {
        setBackendDown(true)
      }
    }
  }, [apiBaseUrl])

  useEffect(() => {
    // Run immediately on mount
    checkNow()

    // Then poll on an interval
    const interval = setInterval(checkNow, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [checkNow])

  return { backendDown, health, lastChecked, checkNow }
}
