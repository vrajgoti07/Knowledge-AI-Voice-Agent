// ============================================================
// SearchExperienceSection — Clean (No Sparkles Icon)
// ============================================================

import { useState } from 'react'
import { Search, TrendingUp, Clock, ArrowRight, BookOpen, ShieldCheck, Cpu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Badge } from '@/components/ui'
import { ROUTES } from '@/constants'

const RECENT_SEARCHES = [
  'Transformer architecture paper 2026',
  'Quantum computing error mitigation',
  'CRISPR gene editing legal frameworks',
]

const TRENDING_TOPICS = [
  { label: 'Hybrid RAG vs Graph RAG', count: '1.4k' },
  { label: 'DeepSeek V3 Benchmarks', count: '3.2k' },
  { label: 'Agentic Workflow Systems', count: '2.8k' },
  { label: 'Multimodal Vector Embeddings', count: '940' },
]

const POPULAR_CATEGORIES = [
  { name: 'Machine Learning', count: '12,400 docs', icon: Cpu },
  { name: 'Biomedical & Genomics', count: '8,900 docs', icon: BookOpen },
  { name: 'Legal & Compliance', count: '6,200 docs', icon: ShieldCheck },
  { name: 'Financial Markets', count: '15,100 docs', icon: TrendingUp },
]

export function SearchExperienceSection() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'trending' | 'recent'>('trending')
  const navigate = useNavigate()

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`${ROUTES.CHAT}?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <section className="py-16 bg-slate-950 border-t border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="primary" size="md" className="py-1 px-3">
            Universal Knowledge Search
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Search Across Millions of Verified Pages
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Instantly query your uploaded PDFs, research papers, CSVs, and internal wikis with sub-second hybrid retrieval speed.
          </p>
        </div>

        {/* Large Search Box */}
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSearchSubmit}>
            <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-colors shadow-2xl">
              <div className="flex items-center gap-3 px-3 py-1.5">
                <Search className="w-5 h-5 text-blue-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search AI Knowledge, papers, uploaded PDFs or ask anything..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-white text-sm sm:text-base placeholder:text-slate-500 outline-none"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <Button type="submit" variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {/* Trending / Recent Chips */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('trending')}
                className={`flex items-center gap-1.5 pb-1 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'trending' ? 'border-blue-400 text-blue-400 font-bold' : 'border-transparent hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Trending Searches</span>
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`flex items-center gap-1.5 pb-1 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'recent' ? 'border-blue-400 text-blue-400 font-bold' : 'border-transparent hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Recent Queries</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeTab === 'trending'
                ? TRENDING_TOPICS.map((topic) => (
                    <button
                      key={topic.label}
                      onClick={() => setQuery(topic.label)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:border-blue-500/40 hover:text-white transition-colors cursor-pointer"
                    >
                      <TrendingUp className="w-3 h-3 text-blue-400" />
                      <span>{topic.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({topic.count})</span>
                    </button>
                  ))
                : RECENT_SEARCHES.map((search) => (
                    <button
                      key={search}
                      onClick={() => setQuery(search)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:border-blue-500/40 hover:text-white transition-colors cursor-pointer"
                    >
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>{search}</span>
                    </button>
                  ))}
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto pt-2">
          {POPULAR_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <Card key={cat.name} hoverable className="p-4 flex items-center gap-3 bg-slate-900/90 border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold">{cat.name}</p>
                  <p className="text-slate-400 text-[11px] font-mono">{cat.count}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
