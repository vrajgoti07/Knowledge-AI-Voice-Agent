// ============================================================
// CTASection — Bottom High-Conversion Banner (Clean, No Sparkles Icon)
// ============================================================

import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { ROUTES } from '@/constants'

export function CTASection() {
  return (
    <section className="py-16 bg-slate-950 border-t border-slate-800 text-slate-100 text-center">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="space-y-3">
          <Badge variant="primary" size="md" className="py-1 px-3">
            Start Researching Today
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Experience Research-Grade AI Knowledge Assistant
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Join researchers and engineers who trust Knowledge AI for precise, footnoted knowledge discovery.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to={ROUTES.REGISTER}>
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Get Started Free
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Instant Setup in 30 Seconds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            <span>No Credit Card Required</span>
          </div>
        </div>
      </div>
    </section>
  )
}
