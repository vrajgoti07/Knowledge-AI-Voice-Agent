// ============================================================
// StatsSection — Accurate Knowledge Benchmarks
// ============================================================

import React from 'react'
import { BookOpen, Search, Clock, CheckCircle2, Layers } from 'lucide-react'
import { Card, Badge } from '@/components/ui'

const STATS = [
  { label: 'Curated Documents',    value: '100+',     desc: 'Indexed AI/ML papers & books', icon: BookOpen },
  { label: 'Knowledge Categories', value: '8',        desc: 'Organized AI domain clusters',  icon: Layers },
  { label: 'Voice AI Latency',     value: '< 2 sec',  desc: 'Sub-2-second response speed',   icon: Clock },
  { label: 'Search Indexing',      value: 'Hybrid',   desc: 'BM25 + Semantic Vector Search', icon: Search },
  { label: 'Grounded Answers',     value: '100%',     desc: 'Every claim backed by citations', icon: CheckCircle2 },
]

export function StatsSection() {
  return (
    <section className="py-16 bg-bg-secondary border-t border-border text-text-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="primary" size="md" className="py-1 px-3">
            Knowledge Engine Metrics
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">
            Curated Knowledge Base & Sub-Second Latency
          </h2>
          <p className="text-text-secondary text-sm sm:text-base">
            Engineered with Gemini 2.5 Flash and hybrid RAG retrieval to eliminate hallucinations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} hoverable className="p-5 bg-bg-card border-border space-y-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight font-mono">
                    {stat.value}
                  </p>
                  <p className="text-xs font-bold text-text-primary mt-1">{stat.label}</p>
                  <p className="text-[11px] text-text-muted mt-1 leading-snug">{stat.desc}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
