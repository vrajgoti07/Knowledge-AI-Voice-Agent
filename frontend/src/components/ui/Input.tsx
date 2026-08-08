// ============================================================
// Shared UI Component — Input (#0A0E1A BG & #1E293B Border)
// ============================================================

import React from 'react'
import { cn } from '@/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#F1F5F9]">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[#60A5FA] pointer-events-none shrink-0">
              {leftIcon}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full rounded-xl border border-[#1E293B] bg-[#0A0E1A] text-sm text-[#F1F5F9] placeholder:text-[#64748B]',
              'px-3.5 py-2.5 transition-colors duration-150 outline-none',
              'focus:border-[#3B82F6] focus:ring-2 focus:ring-[#60A5FA]',
              'disabled:opacity-40 disabled:bg-[#121A2C] disabled:cursor-not-allowed',
              error ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/30' : 'border-[#1E293B]',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 text-[#94A3B8] shrink-0">
              {rightIcon}
            </span>
          )}
        </div>

        {error ? (
          <p className="text-xs text-[#EF4444] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#94A3B8]">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
