// ============================================================
// SecuritySessionsCard — Session Management & Security Score
// ============================================================

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Smartphone, Laptop, LogOut, Key, CheckCircle, AlertTriangle } from 'lucide-react'
import { toast } from '@/store/uiStore'

export function SecuritySessionsCard() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [trustedDevice, setTrustedDevice] = useState(true)

  const handleRevoke = (device: string) => {
    toast.success('Session Revoked', `${device} session has been logged out.`)
  }

  return (
    <div className="space-y-6 text-left">
      {/* Security Score Header */}
      <div className="card p-6 bg-bg-card border-border/80 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-accent-green/10 border border-accent-green/30 text-accent-green flex items-center justify-center font-bold font-mono text-lg">
            92%
          </div>
          <div>
            <h4 className="text-text-primary text-sm font-semibold">Account Security Score</h4>
            <p className="text-text-muted text-xs">Strong protection against unauthorized access.</p>
          </div>
        </div>
        <span className="badge-green text-xs">High Security</span>
      </div>

      {/* 2FA & Trusted Device */}
      <div className="card p-6 bg-bg-card border-border/80 space-y-4">
        <h4 className="text-text-primary text-sm font-semibold flex items-center gap-2">
          <Key className="w-4 h-4 text-accent-blue" />
          <span>Security Options</span>
        </h4>

        <div className="flex items-center justify-between py-2 border-b border-border/40">
          <div>
            <p className="text-xs font-semibold text-text-primary">Two-Factor Authentication (2FA)</p>
            <p className="text-[11px] text-text-muted">Require an email OTP code when logging in from new devices.</p>
          </div>
          <button
            onClick={() => {
              setTwoFactorEnabled(!twoFactorEnabled)
              toast.info(twoFactorEnabled ? '2FA Disabled' : '2FA Enabled')
            }}
            className={`w-11 h-6 rounded-full p-1 transition-colors ${
              twoFactorEnabled ? 'bg-accent-green' : 'bg-bg-secondary border border-border/80'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-bg-primary transition-transform ${twoFactorEnabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-xs font-semibold text-text-primary">Remember This Device</p>
            <p className="text-[11px] text-text-muted">Stay logged in for 30 days on this browser.</p>
          </div>
          <button
            onClick={() => setTrustedDevice(!trustedDevice)}
            className={`w-11 h-6 rounded-full p-1 transition-colors ${
              trustedDevice ? 'bg-accent-blue' : 'bg-bg-secondary border border-border/80'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-bg-primary transition-transform ${trustedDevice ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="card p-6 bg-bg-card border-border/80 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-text-primary text-sm font-semibold flex items-center gap-2">
            <Laptop className="w-4 h-4 text-accent-green" />
            <span>Active Sessions</span>
          </h4>
          <button
            onClick={() => toast.warning('Sessions Revoked', 'Logged out of all other devices.')}
            className="text-xs text-danger hover:underline font-medium"
          >
            Logout All Devices
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* Current Device */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated/70 border border-border/60">
            <div className="flex items-center gap-3">
              <Laptop className="w-4 h-4 text-accent-green" />
              <div>
                <p className="text-text-primary font-medium">Windows PC — Chrome (Current)</p>
                <p className="text-text-muted text-[11px]">IP: 192.168.0.111 • Active Now</p>
              </div>
            </div>
            <span className="badge-green text-[10px]">Active</span>
          </div>

          {/* Secondary Device */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-bg-secondary border border-border/40">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-text-muted" />
              <div>
                <p className="text-text-primary font-medium">iPhone 15 Pro — Safari</p>
                <p className="text-text-muted text-[11px]">IP: 172.56.21.90 • 2 hours ago</p>
              </div>
            </div>
            <button
              onClick={() => handleRevoke('iPhone 15 Pro')}
              className="text-text-muted hover:text-danger text-[11px]"
            >
              Revoke
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
