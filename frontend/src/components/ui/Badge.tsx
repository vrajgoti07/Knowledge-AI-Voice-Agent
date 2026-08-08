// ============================================================
// Shared UI Component — Badge (#3B82F6 & Status Tokens)
// ============================================================

import React from 'react'
import { cn } from '@/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'cyan' | 'success' | 'warning' | 'danger' | 'neutral'
  size?: 'sm' | 'md'
}

export function Badge({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: BadgeProps) {
  const variants = {
    primary: 'bg-[#3B82F6]/15 text-[#60A5FA] border-[#3B82F6]/30',
    cyan:    'bg-[#60A5FA]/15 text-[#60A5FA] border-[#60A5FA]/30',
    success: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30',
    warning: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
    danger:  'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
    neutral: 'bg-[#121A2C] text-[#94A3B8] border-[#1E293B]',
  }

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-mono',
    md: 'text-xs px-2.5 py-1 font-semibold',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border tracking-tight',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
