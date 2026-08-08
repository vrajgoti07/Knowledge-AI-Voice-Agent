// ============================================================
// Shared UI Component — ToggleSwitch (Pill Toggle Component)
// ============================================================

import React from 'react'
import { cn } from '@/utils'

export interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}: ToggleSwitchProps) {
  return (
    <label className={cn('flex items-center justify-between gap-4 cursor-pointer select-none', disabled && 'opacity-40 cursor-not-allowed', className)}>
      {(label || description) && (
        <div className="space-y-0.5 min-w-0 flex-1">
          {label && <p className="text-sm font-semibold text-[#F1F5F9]">{label}</p>}
          {description && <p className="text-xs text-[#94A3B8]">{description}</p>}
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]',
          checked ? 'bg-[#3B82F6]' : 'bg-[#1E293B]'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </label>
  )
}
