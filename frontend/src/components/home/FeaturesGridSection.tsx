// ============================================================
// FeaturesGridSection — Clean (No Sparkles Icon)
// ============================================================

import React from 'react'
import { Brain, FileSearch, Mic, Zap, Shield, Layers, BookOpen, Code, Cpu } from 'lucide-react'
import { Card, Badge } from '@/components/ui'

const REAL_CATEGORIES = [
  { name: 'Machine Learning', count: '18 papers', icon: Cpu },
  { name: 'Deep Learning', count: '24 papers', icon: Brain },
  { name: 'Python & Data Science', count: '14 guides', icon: Code },
  { name: 'LLMs & RAG', count: '22 papers', icon: Cpu },
  { name: 'LangChain & Workflows', count: '16 docs', icon: Layers },
  { name: 'Research Papers', count: '20 PDFs', icon: BookOpen },
]

const FEATURES = [
  {
    id: 'hybrid-rag',
    title: 'Hybrid RAG Pipeline',
    subtitle: 'BM25 + Dense Vectors',
    description: 'Combines keyword sparse search with dense semantic vector search for unmatched answer precision across curated papers.',
    icon: Brain,
    badge: 'Core Engine',
  },
  {
    id: 'footnotes',
    title: 'Grounded Footnote Citations',
    subtitle: '100% Traceable Sources',
    description: 'Click any numerical citation footnote [1] [2] to inspect exact source chunks, page numbers, and original document text.',
    icon: FileSearch,
    badge: 'Research Grade',
  },
  {
    id: 'gemini-flash',
    title: 'Gemini 2.5 Flash LLM',
    subtitle: 'High-Speed Synthesis',
    description: 'Powered by Gemini 2.5 Flash for sub-2-second answers with strict contextual adherence and zero hallucination.',
    icon: Zap,
    badge: 'LLM Engine',
  },
  {
    id: 'voice-ai',
    title: 'Voice AI Mode',
    subtitle: 'Real-time Voice Interface',
    description: 'Talk directly with your knowledge base using real-time voice synthesis and interactive transcript controls.',
    icon: Mic,
    badge: 'Voice Mode',
  },
  {
    id: 'doc-upload',
    title: 'Personal Document Upload',
    subtitle: 'PDF, DOCX, TXT, MD',
    description: 'Upload your own technical PDFs and documents to expand your private RAG vector workspace.',
    icon: Layers,
    badge: 'Ingestion',
  },
  {
    id: 'security',
    title: 'Private & Secure Storage',
    subtitle: 'Isolated Tenant Vaults',
    description: 'Your uploaded files remain private and are never shared or used to train external public LLM models.',
    icon: Shield,
    badge: 'Security',
  },
]

export function FeaturesGridSection() {
  return (
    <section id="features" className="py-16 bg-bg-primary border-t border-border text-text-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Features Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="primary" size="md" className="py-1 px-3">
            Engineered for Precision
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">
            Curated Technical Knowledge & RAG Intelligence
          </h2>
          <p className="text-text-secondary text-sm sm:text-base">
            Every feature is designed to replace guesswork with verified, footnoted knowledge retrieval.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feat) => {
            const Icon = feat.icon
            return (
              <Card key={feat.id} hoverable className="p-5 bg-bg-card border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="neutral" size="sm">{feat.badge}</Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-text-primary">{feat.title}</h3>
                  <p className="text-[11px] font-mono text-text-muted">{feat.subtitle}</p>
                  <p className="text-xs text-text-secondary leading-relaxed pt-1">{feat.description}</p>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Real KB Categories Showcase */}
        <div className="pt-8 border-t border-border space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-lg font-bold text-text-primary">Curated AI/ML Knowledge Categories</h3>
            <p className="text-xs text-text-secondary">Explore pre-indexed research domains in Knowledge AI</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {REAL_CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <Card key={cat.name} hoverable className="p-4 flex items-center gap-3 bg-bg-secondary border-border">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-text-primary text-xs font-bold">{cat.name}</p>
                    <p className="text-text-muted text-[11px] font-mono">{cat.count}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
