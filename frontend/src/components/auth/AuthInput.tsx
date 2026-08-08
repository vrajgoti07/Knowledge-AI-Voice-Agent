// ============================================================
// AuthInput — Premium Input Component with Validation & Icons
// ============================================================

import React, { forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/utils'

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  success?: boolean
  icon?: React.ComponentType<{ className?: string }>
  rightElement?: React.ReactNode
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, success, icon: Icon, rightElement, className, id, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const inputId = id || `auth-input-${label.toLowerCase().replace(/\s+/g, '-')}`

    return (
      <div className="space-y-1.5 text-left w-full">
        <label htmlFor={inputId} className="block text-xs font-semibold text-text-primary tracking-wide">
          {label}
        </label>

        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3.5 text-text-muted pointer-events-none transition-colors">
              <Icon className={cn('w-4 h-4', focused ? 'text-accent-blue' : 'text-text-muted')} />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            onFocus={(e) => {
              setFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              props.onBlur?.(e)
            }}
            className={cn(
              'w-full bg-bg-secondary/90 border border-border/80 rounded-xl text-sm text-text-primary',
              'py-3 text-sm transition-all duration-200 outline-none',
              Icon ? 'pl-10' : 'pl-4',
              rightElement || error || success ? 'pr-10' : 'pr-4',
              focused && 'border-accent-blue/80 ring-2 ring-accent-blue/20 bg-bg-secondary',
              error && 'border-danger/80 ring-2 ring-danger/20',
              success && 'border-accent-green/80 ring-2 ring-accent-green/20',
              className
            )}
            {...props}
          />

          <div className="absolute right-3.5 flex items-center gap-1">
            {rightElement}
            {!rightElement && error && <AlertCircle className="w-4 h-4 text-danger animate-bounce-sm" />}
            {!rightElement && success && <CheckCircle2 className="w-4 h-4 text-accent-green" />}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[11px] text-danger font-medium flex items-center gap-1 pl-1"
            >
              <span>{error}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'
