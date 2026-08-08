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
            'w-full rounded-lg border bg-bg-primary text-sm text-text-primary placeholder:text-text-muted',
            'px-3.5 py-2.5 transition-colors duration-150 outline-none resize-y min-h-[100px]',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            'disabled:opacity-50 disabled:bg-bg-secondary disabled:cursor-not-allowed',
            error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border',
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
