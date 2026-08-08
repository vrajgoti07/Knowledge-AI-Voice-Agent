// ============================================================
// Shared UI Component — Card (#121A2C BG & #1E293B Border)
// ============================================================

import React from 'react'
import { cn } from '@/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hoverable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl bg-[#121A2C] border border-[#1E293B] p-5.5 transition-colors duration-150',
          hoverable && 'hover:bg-[#16213A] hover:border-[#3B82F6]/60 cursor-pointer',
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
