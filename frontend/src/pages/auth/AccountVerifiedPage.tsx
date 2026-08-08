// ============================================================
// AccountVerifiedPage — Account Ready Success Screen
// ============================================================

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Sparkles, Home } from 'lucide-react'
import { AuthCard } from '@/components/auth/AuthCard'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants'

export default function AccountVerifiedPage() {
  usePageTitle('Account Verified')

  return (
    <AuthCard className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-16 h-16 rounded-full bg-accent-green/20 border-2 border-accent-green text-accent-green flex items-center justify-center mx-auto shadow-glow-green"
      >
        <CheckCircle2 className="w-8 h-8" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-text-primary font-sans">Account Ready!</h2>
        <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
          Your email address has been verified. You now have full access to Khnowlge AI knowledge search & RAG tools.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        <Link to={ROUTES.DASHBOARD}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-glow-green"
          >
            <Sparkles className="w-4 h-4 text-accent-green" />
            <span>Go to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </Link>

        <Link to={ROUTES.HOME}>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="btn-outline w-full py-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5 text-text-muted" />
            <span>Return Home</span>
          </motion.button>
        </Link>
      </div>
    </AuthCard>
  )
}
