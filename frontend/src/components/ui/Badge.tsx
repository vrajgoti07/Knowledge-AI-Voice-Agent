// ============================================================
// Shared UI Component — Badge (#3B82F6 & Status Tokens)
// ============================================================

import React from 'react'
import { cn } from '@/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'cyan' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple'
  size?: 'sm' | 'md'
  dot?: boolean
  dotPulse?: boolean
}

export function Badge({
  children,
  className,
  variant = 'primary',
  size = 'md',
  dot = false,
  dotPulse = false,
  ...props
}: BadgeProps) {
  const variants = {
    primary: 'bg-[#3B82F6]/15 text-[#60A5FA] border-[#3B82F6]/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
    cyan:    'bg-[#06B6D4]/15 text-[#22D3EE] border-[#06B6D4]/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]',
    success: 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
    warning: 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30',
    danger:  'bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/30',
    neutral: 'bg-white/[0.04] text-[#94A3B8] border-white/10',
    purple:  'bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30 shadow-[0_0_10px_rgba(139,92,246,0.1)]',
  }

  const dotColors = {
    primary: 'bg-[#60A5FA]',
    cyan:    'bg-[#22D3EE]',
    success: 'bg-[#34D399]',
    warning: 'bg-[#FBBF24]',
    danger:  'bg-[#F87171]',
    neutral: 'bg-[#94A3B8]',
    purple:  'bg-[#A78BFA]',
  }

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-mono',
    md: 'text-xs px-2.5 py-0.5 font-semibold',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border tracking-tight select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[variant],
            dotPulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </span>
  )
}
