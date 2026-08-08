// ============================================================
// SocialLogin — Google & GitHub Auth Buttons
// ============================================================

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

export function SocialLogin({ onSocialSelect }: { onSocialSelect: (provider: 'google' | 'github') => void }) {
  return (
    <div className="space-y-3 w-full">
      <div className="relative flex items-center justify-center my-4">
        <div className="w-full border-t border-border/60" />
        <span className="absolute px-3 bg-bg-card text-[11px] font-mono text-text-muted uppercase tracking-wider">
          or continue with
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Google */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSocialSelect('google')}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-bg-secondary border border-border/70 hover:border-border hover:bg-bg-elevated transition-all text-xs font-medium text-text-primary"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
          <span>Google</span>
        </motion.button>

        {/* GitHub */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSocialSelect('github')}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-bg-secondary border border-border/70 hover:border-border hover:bg-bg-elevated transition-all text-xs font-medium text-text-primary"
        >
          <ExternalLink className="w-4 h-4 text-text-secondary" />
          <span>GitHub</span>
        </motion.button>
      </div>
    </div>
  )
}
