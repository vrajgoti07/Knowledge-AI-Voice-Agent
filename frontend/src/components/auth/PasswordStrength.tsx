// ============================================================
// PasswordStrength — Live Strength Meter & Validation Checklist
// ============================================================

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { cn } from '@/utils'

export function PasswordStrength({ password = '' }: { password?: string }) {
  const criteria = useMemo(() => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'One number (0-9)', met: /[0-9]/.test(password) },
    { label: 'One special character (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(password) },
  ], [password])

  const metCount = criteria.filter(c => c.met).length

  const scoreLabel = useMemo(() => {
    if (!password) return { text: 'Empty', color: 'text-text-muted', barColor: 'bg-border', percent: 0 }
    if (metCount <= 2) return { text: 'Weak', color: 'text-danger', barColor: 'bg-danger', percent: 30 }
    if (metCount <= 4) return { text: 'Medium', color: 'text-warning', barColor: 'bg-warning', percent: 70 }
    return { text: 'Strong', color: 'text-accent-green', barColor: 'bg-accent-green', percent: 100 }
  }, [metCount, password])

  if (!password) return null

  return (
    <div className="space-y-3 pt-1 text-left">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[11px] font-mono">
          <span className="text-text-muted">Password Strength</span>
          <span className={cn('font-semibold', scoreLabel.color)}>{scoreLabel.text}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${scoreLabel.percent}%` }}
            transition={{ duration: 0.3 }}
            className={cn('h-full rounded-full transition-colors', scoreLabel.barColor)}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
        {criteria.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <div className={cn(
              'w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0',
              c.met ? 'bg-accent-green/20 text-accent-green' : 'bg-bg-secondary text-text-muted'
            )}>
              {c.met ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
            </div>
            <span className={c.met ? 'text-text-primary' : 'text-text-muted'}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
