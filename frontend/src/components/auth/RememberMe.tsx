// ============================================================
// RememberMe — Checkbox Component
// ============================================================

import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils'

export function RememberMe({
  checked,
  onChange,
  label = 'Remember me for 30 days',
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group text-left">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-150',
          checked
            ? 'bg-accent-green border-accent-green text-bg-primary'
            : 'bg-bg-secondary border-border/80 group-hover:border-accent-green/60'
        )}
      >
        {checked && <Check className="w-3 h-3 stroke-[3]" />}
      </div>
      <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
        {label}
      </span>
    </label>
  )
}
