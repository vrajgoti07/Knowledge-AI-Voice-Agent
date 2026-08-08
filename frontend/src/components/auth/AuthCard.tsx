// ============================================================
// AuthCard — Clean Card Container for Auth Forms
// ============================================================

import { motion } from 'framer-motion'
import { scaleIn } from '@/animations/variants'
import { cn } from '@/utils'

export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'w-full max-w-[440px] p-6 sm:p-8 rounded-2xl',
        'bg-bg-card border border-border shadow-xs relative overflow-hidden',
        className
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
      {children}
    </motion.div>
  )
}
