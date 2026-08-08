// ============================================================
// SolutionsSection — Workflows Tailored for Personas
// ============================================================

import { useState } from 'react'
import { GraduationCap, Code2, Microchip, Building2, Check } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'

const SOLUTIONS = [
  {
    id: 'researchers',
    label: 'Researchers & Scientists',
    icon: GraduationCap,
    heading: 'Synthesize Literature & Footnote Citations',
    description: 'Cross-reference hundreds of papers simultaneously. Extract methodologies, statistical findings, and exact references in seconds.',
    bullets: [
      'Automatic DOI citation generation',
      'PDF paper chunking & table extraction',
      'Cross-document synthesis & contrast matrices',
    ],
    sampleQuery: 'Compare the accuracy metrics between RAG-Sequence and RAG-Token approaches in Lewis et al. 2020.',
  },
  {
    id: 'developers',
    label: 'Software Developers',
    icon: Code2,
    heading: 'Instant API & Architecture Documentation Search',
    description: 'Stop digging through markdown files. Get working code snippets with strict contextual accuracy.',
    bullets: [
      'Syntax highlighted code block responses',
      'API reference semantic matching',
      'Version-specific dependency checks',
    ],
    sampleQuery: 'Show how to initialize a vector index with hybrid sparse-dense vectors in TypeScript.',
  },
  {
    id: 'students',
    label: 'Students & Academics',
    icon: Microchip,
    heading: 'Master Textbooks & Complex Subject Matter',
    description: 'Turn 800-page textbooks into interactive study tutors. Ask conceptual questions and receive step-by-step explanations.',
    bullets: [
      'Page-level textbook citations',
      'Concept summaries & flashcard synthesis',
      'Equation & formula decomposition',
    ],
    sampleQuery: 'Explain backpropagation through time in recurrent neural networks with a simple example.',
  },
  {
    id: 'enterprise',
    label: 'Enterprise Teams',
    icon: Building2,
    heading: 'Centralize Internal Knowledge & Operations',
    description: 'Unify company wikis, SOPs, customer tickets, and compliance documents into one secure, searchable vault.',
    bullets: [
      'Role-based access control (RBAC)',
      'Isolated VPC vector storage options',
      'Audit logging & analytics dashboard',
    ],
    sampleQuery: 'What is our corporate policy regarding data retention for EU customer records under GDPR?',
  },
]

export function SolutionsSection() {
  const [activeId, setActiveId] = useState(SOLUTIONS[0].id)
  const activeSolution = SOLUTIONS.find((s) => s.id === activeId) ?? SOLUTIONS[0]

  return (
    <section id="solutions" className="py-16 bg-slate-900 border-t border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="primary" size="md" className="py-1 px-3">
            Workflows Tailored For You
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Designed for Every Knowledge Professional
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Select a profile to see how Knowledge AI accelerates your specific research workflow.
          </p>
        </div>

        {/* Persona Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {SOLUTIONS.map((sol) => {
            const Icon = sol.icon
            const active = sol.id === activeId
            return (
              <button
                key={sol.id}
                onClick={() => setActiveId(sol.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{sol.label}</span>
              </button>
            )}
          )}
        </div>

        {/* Selected Persona Showcase */}
        <Card className="max-w-4xl mx-auto p-6 sm:p-8 bg-slate-950/90 border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <Badge variant="primary" size="sm">{activeSolution.label}</Badge>
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {activeSolution.heading}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {activeSolution.description}
              </p>

              <ul className="space-y-2 pt-1">
                {activeSolution.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2 text-xs text-slate-200 font-medium">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pb-2 border-b border-slate-800">
                <span>Sample Query</span>
                <Badge variant="neutral" size="sm">Hybrid Search</Badge>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200">
                "{activeSolution.sampleQuery}"
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">
                  AI Response Preview
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Based on vectorized paper index [1], the hybrid retrieval strategy achieves 98.2% exact matches...
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
