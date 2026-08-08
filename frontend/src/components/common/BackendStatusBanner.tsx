// ============================================================
// BackendStatusBanner — App-wide crash/degraded banner
// Appears at the top of every page when the backend is
// unreachable or a dependency (DB/Qdrant/Redis) is down.
// Auto-dismisses on recovery.
// ============================================================

import React, { useState, useEffect } from 'react'
import { useHealthCheck } from '@/hooks/useHealthCheck'
import { API_BASE_URL } from '@/constants'

interface DotProps { ok: boolean; label: string }

function StatusDot({ ok, label }: DotProps) {
  return (
    <span
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '4px',
        fontSize:       '11px',
        color:          ok ? '#86efac' : '#fca5a5',
        fontWeight:     500,
      }}
    >
      <span
        style={{
          width:           '6px',
          height:          '6px',
          borderRadius:    '50%',
          background:      ok ? '#22c55e' : '#ef4444',
          display:         'inline-block',
          boxShadow:       ok ? '0 0 4px #22c55e' : '0 0 4px #ef4444',
          animation:       ok ? 'none' : 'kai-pulse 1.5s ease-in-out infinite',
        }}
      />
      {label}
    </span>
  )
}

export function BackendStatusBanner() {
  const { backendDown, health, lastChecked, checkNow } = useHealthCheck(API_BASE_URL)
  const [dismissed, setDismissed] = useState(false)

  // Auto-un-dismiss when backend recovers
  useEffect(() => {
    if (!backendDown) setDismissed(false)
  }, [backendDown])

  if (!backendDown || dismissed) return null

  const isUnreachable = health === null
  const isDegraded    = health?.status === 'degraded'

  const bannerBg    = 'rgba(30, 10, 10, 0.97)'
  const borderColor = '#991b1b'
  const accentColor = '#ef4444'

  return (
    <>
      {/* Inject keyframes once */}
      <style>{`
        @keyframes kai-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes kai-banner-in {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div
        role="alert"
        aria-live="assertive"
        style={{
          position:        'fixed',
          top:             0,
          left:            0,
          right:           0,
          zIndex:          9999,
          background:      bannerBg,
          borderBottom:    `1px solid ${borderColor}`,
          backdropFilter:  'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding:         '10px 20px',
          display:         'flex',
          alignItems:      'center',
          gap:             '12px',
          boxShadow:       `0 2px 20px rgba(239,68,68,0.25)`,
          animation:       'kai-banner-in 0.3s ease-out',
          fontFamily:      'inherit',
        }}
      >
        {/* Icon */}
        <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>

        {/* Message */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ color: accentColor, fontWeight: 600, fontSize: '13px', marginRight: '8px' }}>
            {isUnreachable
              ? 'Backend server is unreachable'
              : 'Backend service degraded'}
          </span>
          <span style={{ color: '#fca5a5', fontSize: '12px' }}>
            {isUnreachable
              ? '— retrying every 30 s. Check that the API server is running.'
              : '— one or more dependencies are down.'}
          </span>

          {/* Dependency status pills (only when we got a response) */}
          {health && (
            <span style={{ display: 'inline-flex', gap: '10px', marginLeft: '12px' }}>
              <StatusDot ok={health.db}     label="DB" />
              <StatusDot ok={health.qdrant} label="Qdrant" />
              <StatusDot ok={health.redis}  label="Redis" />
            </span>
          )}
        </div>

        {/* Retry + Dismiss */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
          {lastChecked && (
            <span style={{ color: '#6b7280', fontSize: '11px' }}>
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => checkNow()}
            style={{
              background:    'rgba(239,68,68,0.15)',
              border:        '1px solid rgba(239,68,68,0.4)',
              color:         '#fca5a5',
              borderRadius:  '6px',
              padding:       '3px 10px',
              fontSize:      '11px',
              fontWeight:    600,
              cursor:        'pointer',
              transition:    'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
          >
            Retry now
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            style={{
              background:    'transparent',
              border:        'none',
              color:         '#6b7280',
              fontSize:      '16px',
              cursor:        'pointer',
              lineHeight:    1,
              padding:       '0 4px',
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Spacer so page content isn't hidden under the banner */}
      <div style={{ height: '48px' }} aria-hidden="true" />
    </>
  )
}
