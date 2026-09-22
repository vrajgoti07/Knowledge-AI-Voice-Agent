// ============================================================
// Shared UI Component — Card (#121A2C BG & #1E293B Border)
// ============================================================

import React from 'react'
import { cn } from '@/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  variant?: 'default' | 'glass' | 'subtle' | 'glow'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hoverable = false, variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-[#121A2C] border-[#1E293B]',
      glass: 'bg-[#121A2C]/75 backdrop-blur-xl border-white/10 shadow-xl',
      subtle: 'bg-white/[0.02] border-white/[0.06]',
      glow: 'bg-[#121A2C] border-[#38BDF8]/30 shadow-[0_0_25px_rgba(56,189,248,0.08)]',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-2xl border p-5.5 transition-all duration-200 overflow-hidden',
          'before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
          variantStyles[variant] || variantStyles.default,
          hoverable && 'hover:bg-[#16213A] hover:border-[#3B82F6]/50 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer active:scale-[0.995]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
