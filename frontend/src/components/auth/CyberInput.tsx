// ============================================================
// CyberInput — Cyber-Physical Gateway Form Input Component
// Features flat bg-slate-950/50, left-to-right animated cyan focus sweep,
// and icon color transitions to cyan on focus.
// Colors: Uses unified design tokens from index.css @theme.
// ============================================================

import React, { forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/utils'

export interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ComponentType<{ className?: string }>
  isPassword?: boolean
  rightAction?: React.ReactNode
}

export const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
  ({ label, error, icon: Icon, isPassword, rightAction, className, id, type = 'text', ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const inputId = id || `cyber-input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    const errorId = `${inputId}-error`

    const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="space-y-1.5 text-left w-full">
        {/* Label Row */}
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className={cn(
              'block text-xs font-semibold tracking-wide transition-colors duration-200',
              focused ? 'text-accent-light' : 'text-slate-300'
            )}
          >
            {label}
          </label>
          {rightAction}
        </div>

        {/* Input Wrapper with Focus Sweep Animation */}
        <div className="cyber-input-wrapper group relative">
          <div
            className={cn(
              'relative flex items-center rounded-xl bg-slate-950/60 border transition-all duration-200 overflow-hidden',
              error
                ? 'border-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                : focused
                ? 'border-slate-700 bg-slate-950/80 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-accent-primary/40'
                : 'border-slate-800 hover:border-slate-700/80'
            )}
          >
            {/* Left Icon (Transitions to Cyan on Focus) */}
            {Icon && (
              <div className="pl-3.5 pr-1 pointer-events-none shrink-0 flex items-center justify-center">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors duration-200',
                    error ? 'text-red-400' : focused ? 'text-accent-light drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]' : 'text-slate-500 group-hover:text-slate-400'
                  )}
                />
              </div>
            )}

            {/* Core HTML Input with standard password manager compatibility */}
            <input
              ref={ref}
              id={inputId}
              type={effectiveType}
              value={props.value !== undefined ? props.value : ''}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              onFocus={(e) => {
                setFocused(true)
                props.onFocus?.(e)
              }}
              onBlur={(e) => {
                setFocused(false)
                props.onBlur?.(e)
              }}
              className={cn(
                'w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500',
                'py-2.5 text-xs sm:text-sm transition-all duration-200 outline-none border-none ring-0 focus:outline-none focus:ring-0 focus:border-none',
                Icon ? 'pl-2' : 'pl-3.5',
                isPassword ? 'pr-9' : 'pr-3.5',
                className
              )}
              {...props}
            />

            {/* Password Toggle Button */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className={cn(
                  'absolute right-3 p-1 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-light',
                  focused ? 'text-accent-light hover:text-accent-primary' : 'text-slate-500 hover:text-slate-300'
                )}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-accent-light drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Animated Sweeping Cyan Line (left-to-right sweep) */}
          <div className="cyber-input-sweep" />
        </div>

        {/* Animated Error Feedback */}
        <AnimatePresence>
          {error && (
            <motion.p
              id={errorId}
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-red-400 font-medium flex items-center gap-1.5 pl-1 pt-0.5"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
              <span>{error}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

CyberInput.displayName = 'CyberInput'
