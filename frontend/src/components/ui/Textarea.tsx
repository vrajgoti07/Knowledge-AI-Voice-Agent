// ============================================================
// Shared UI Component — Textarea
// ============================================================

import React from 'react'
import { cn } from '@/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-primary">
            {label}
          </label>
        )}

        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-xl border border-white/10 bg-[#0A0E1A] text-sm text-[#F1F5F9] placeholder:text-[#64748B]',
            'px-3.5 py-2.5 transition-all duration-150 outline-none resize-y min-h-[100px]',
            'hover:border-white/20',
            'focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/25 focus:shadow-[0_0_20px_rgba(56,189,248,0.15)]',
            'disabled:opacity-40 disabled:bg-[#121A2C] disabled:cursor-not-allowed',
            error ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/30' : '',
            className
          )}
          {...props}
        />

        {error ? (
          <p className="text-xs text-danger font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-muted">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
