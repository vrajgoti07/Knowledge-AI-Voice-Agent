// ============================================================
// Public Layout — Landing page, docs, pricing, about
// Enables transparent page background for global AuroraMesh animations
// ============================================================

import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PublicHeader } from '@/components/common/PublicHeader'
import { PublicFooter } from '@/components/common/PublicFooter'
import { pageVariants } from '@/animations/variants'

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E1A] text-[#F1F5F9] relative">
      <PublicHeader />
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <PublicFooter />
    </div>
  )
}
