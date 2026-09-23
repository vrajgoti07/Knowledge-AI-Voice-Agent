// ============================================================
// useSystemHealth — Single Source of Truth for Backend Health
// Shared singleton probe avoiding redundant network requests.
// Synchronizes status across AuthHeaderControls and VoiceAgentOrb.
// ============================================================

import { useState, useEffect } from 'react'
import { apiGet } from '@/services/api'

export type SystemHealthStatus = 'checking' | 'online' | 'degraded' | 'offline'

interface HealthResponse {
  status?: 'ok' | 'degraded'
  db?: boolean
  qdrant?: boolean
  redis?: boolean
}

let globalStatus: SystemHealthStatus = 'checking'
const listeners = new Set<(status: SystemHealthStatus) => void>()
let checkPromise: Promise<void> | null = null

function notifyListeners() {
  listeners.forEach((fn) => fn(globalStatus))
}

export async function fetchSystemHealth(): Promise<SystemHealthStatus> {
  if (checkPromise) {
    await checkPromise
    return globalStatus
  }

  checkPromise = (async () => {
    try {
      const res = await Promise.race([
        apiGet<HealthResponse>('/health'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('HEALTH_TIMEOUT')), 4000)
        ),
      ])

      if (res?.status === 'ok' || res?.db === true) {
        globalStatus = 'online'
      } else if (res?.status === 'degraded') {
        globalStatus = 'degraded'
      } else {
        globalStatus = 'online'
      }
    } catch {
      globalStatus = 'offline'
    } finally {
      notifyListeners()
      checkPromise = null
    }
  })()

  await checkPromise
  return globalStatus
}

export function useSystemHealth() {
  const [status, setStatus] = useState<SystemHealthStatus>(globalStatus)

  useEffect(() => {
    listeners.add(setStatus)

    // Trigger check if still in checking state
    if (globalStatus === 'checking') {
      fetchSystemHealth()
    }

    return () => {
      listeners.delete(setStatus)
    }
  }, [])

  return { status, refresh: fetchSystemHealth }
}
