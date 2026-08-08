// ============================================================
// Shared UI Component — Skeleton Loader
// ============================================================

import React from 'react'
import { cn } from '@/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-bg-secondary border border-border/50', className)}
      {...props}
    />
  )
}
