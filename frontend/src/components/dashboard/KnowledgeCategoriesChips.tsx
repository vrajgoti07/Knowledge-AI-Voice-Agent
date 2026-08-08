// ============================================================
// KnowledgeCategoriesChips — Real Scope Categories Tag List
// ============================================================

import React from 'react'
import { Link } from 'react-router-dom'
import { Brain, ArrowRight } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { ROUTES } from '@/constants'

const CATEGORIES = [
  { name: 'Machine Learning', count: 18 },
  { name: 'Deep Learning', count: 24 },
  { name: 'Python & Data Science', count: 14 },
  { name: 'LLMs & RAG', count: 22 },
  { name: 'LangChain & Workflows', count: 16 },
  { name: 'Research Papers', count: 20 },
]

export function KnowledgeCategoriesChips() {
  return (
    <Card className="p-5 space-y-3 bg-bg-card border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-text-primary">Knowledge Categories</h2>
        </div>
        <Link to={ROUTES.CHAT}>
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Browse all
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat, idx) => (
          <Link key={idx} to={ROUTES.CHAT}>
            <Badge variant="neutral" className="hover:border-primary hover:text-primary transition-colors cursor-pointer py-1.5 px-3 text-xs font-semibold">
              {cat.name} <span className="text-text-muted font-mono font-normal ml-1">({cat.count})</span>
            </Badge>
          </Link>
        ))}
      </div>
    </Card>
  )
}
