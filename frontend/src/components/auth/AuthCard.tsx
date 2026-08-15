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
    <div className="relative w-full max-w-md mx-auto my-auto z-10 flex flex-col items-center">
      <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-blue-600/15 to-cyan-500/20 rounded-3xl blur-2xl opacity-60 pointer-events-none -z-10" />
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          'w-full max-w-[440px] p-6 sm:p-8 rounded-2xl',
          'bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-[0_0_40px_rgba(34,211,238,0.1)] relative overflow-hidden',
          className
        )}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        {children}
      </motion.div>
    </div>
  )
}
