// ============================================================
// Shared UI Component — Select
// ============================================================

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
  helperText?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-primary">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={inputId}
            ref={ref}
            className={cn(
              'w-full appearance-none rounded-lg border bg-bg-primary text-sm text-text-primary',
              'px-3.5 py-2 pr-9 transition-colors duration-150 outline-none cursor-pointer',
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              'disabled:opacity-50 disabled:bg-bg-secondary disabled:cursor-not-allowed',
              error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-primary text-text-primary">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 text-text-muted pointer-events-none shrink-0" />
        </div>

        {error ? (
          <p className="text-xs text-danger font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-muted">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Select.displayName = 'Select'
