// ============================================================
// AuthHeader — Title & Subtitle for Auth Forms
// ============================================================

import { Sparkles } from 'lucide-react'

export function AuthHeader({
  title,
  subtitle,
  icon: Icon = Sparkles,
}: {
  title: string
  subtitle: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="space-y-2 text-center mb-6">
      <div className="w-10 h-10 rounded-2xl bg-accent-green/10 border border-accent-green/30 text-accent-green flex items-center justify-center mx-auto mb-3 shadow-glow-green/20">
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary tracking-tight font-sans">{title}</h2>
      <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">{subtitle}</p>
    </div>
  )
}
