// ============================================================
// PageLoader — Full-page loading screen
// ============================================================

import { motion } from 'framer-motion'
import { APP_NAME } from '@/constants'

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Logo */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0px rgba(114,242,174,0)',
              '0 0 32px rgba(114,242,174,0.4)',
              '0 0 0px rgba(114,242,174,0)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-green to-accent-blue
                     flex items-center justify-center"
        >
          <span className="text-bg-primary font-bold text-2xl font-mono">K</span>
        </motion.div>

        {/* Spinner dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
              className="w-2 h-2 rounded-full bg-accent-green"
            />
          ))}
        </div>

        <p className="label-mono tracking-wider opacity-50">{APP_NAME}</p>
      </motion.div>
    </div>
  )
}
