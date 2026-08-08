// ============================================================
// HeroSection — Clean (No Sparkles Icons)
// ============================================================

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Play, Copy, ThumbsUp, ThumbsDown, Share2,
  Volume2, Check, Search, FileText, BookOpen, MessageSquare, Mic, Terminal, Zap
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { ROUTES } from '@/constants'
import { cn } from '@/utils'

const GENERIC_ROLES = [
  'Graduate Researchers',
  'Software Engineers',
  'AI Developers',
  'Data Scientists',
  'Academic Students',
]

const DEMO_PRESETS = [
  {
    id: 'rag',
    tabLabel: 'RAG Architecture',
    query: 'What is Retrieval-Augmented Generation (RAG)?',
    answer: 'Retrieval-Augmented Generation (RAG) merges dense semantic vector search with Gemini 2.5 Flash to generate precise answers grounded in your uploaded documents.',
    codeSnippet: 'retriever = HybridVectorStore(index="ai_papers", top_k=5)\ncontext = retriever.search(query="RAG architecture")\nresponse = gemini.generate(prompt=query, context=context)',
    citations: [
      { id: 'c1', title: 'Attention_Is_All_You_Need.pdf', page: 4 },
      { id: 'c2', title: 'LangChain_v0.3_Guide.pdf', page: 12 },
    ],
  },
  {
    id: 'attention',
    tabLabel: 'Transformer Attention',
    query: 'How does Scaled Dot-Product Attention work?',
    answer: 'Scaled Dot-Product Attention computes queries Q, keys K, and values V with scaling factor 1/√d_k to prevent extreme dot product magnitudes in deep Transformer layers.',
    codeSnippet: 'scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)\nattention_weights = torch.softmax(scores, dim=-1)\noutput = torch.matmul(attention_weights, V)',
    citations: [
      { id: 'c3', title: 'Transformer_Architecture_Notes.md', page: 2 },
      { id: 'c4', title: 'Deep_Learning_Book_Ch10.pdf', page: 142 },
    ],
  },
  {
    id: 'vector',
    tabLabel: 'Vector HNSW Indexing',
    query: 'Why use HNSW over Flat L2 Indexing?',
    answer: 'Hierarchical Navigable Small World (HNSW) graphs achieve sub-millisecond approximate nearest neighbor retrieval across millions of vectors with log-scale time complexity.',
    codeSnippet: 'index = faiss.IndexHNSWFlat(dimension=768, M=32)\nindex.hnsw.efConstruction = 64\nindex.add(embedding_matrix)',
    citations: [
      { id: 'c5', title: 'Vector_Database_Benchmarks.pdf', page: 8 },
    ],
  },
]

export function HeroSection({ onOpenDemo }: { onOpenDemo: () => void }) {
  const [activePresetId, setActivePresetId] = useState('rag')
  const [copied, setCopied] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeViewTab, setActiveViewTab] = useState<'chat' | 'citations' | 'voice'>('chat')

  const activePreset = DEMO_PRESETS.find((p) => p.id === activePresetId) ?? DEMO_PRESETS[0]

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="relative pt-24 pb-16 overflow-hidden bg-[#0A0E17] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex">
              <Badge variant="primary" size="md" className="py-1.5 px-3.5 font-bold text-xs bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/30">
                <span className="w-2 h-2 rounded-full bg-[#00F2FE] animate-pulse mr-1.5" />
                Gemini 2.5 Flash & Hybrid RAG Engine
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Research Smarter.{' '}
                <span className="text-[#00F2FE] italic">
                  Not Harder.
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-[#9D4EDD]">
                Ask. <span className="text-white font-semibold">Discover.</span>{' '}
                <span className="text-[#00F2FE] font-semibold">Understand.</span>
              </p>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Knowledge AI enables researchers and engineers to query 100+ curated technical papers and personal documents with sub-2-second answers. Every response is grounded in cited sources.
            </p>

            {/* Action Buttons (No Sparkles Icon) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to={ROUTES.REGISTER}>
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Start Research Free
                </Button>
              </Link>

              <Button size="lg" variant="secondary" leftIcon={<Play className="w-4 h-4 text-[#9D4EDD]" />} onClick={onOpenDemo}>
                Watch Demo
              </Button>
            </div>

            {/* Trust Section */}
            <div className="pt-6 border-t border-[#131927]">
              <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Designed for Knowledge Professionals & Teams
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {GENERIC_ROLES.map((role) => (
                  <span
                    key={role}
                    className="px-2.5 py-1 rounded-lg bg-[#131927] border border-[#2D3A54]/60 text-xs font-medium text-slate-300"
                  >
                    ● {role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Interactive AI Research Workspace Showcase */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-[#2D3A54] bg-[#131927] shadow-2xl shadow-cyan-500/10 overflow-hidden transition-all duration-200">
              {/* Window Title Bar */}
              <div className="px-4 py-3 bg-[#0A0E17] border-b border-[#2D3A54] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="w-3 h-3 rounded-full bg-[#FF2A6D] inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#00F2FE] inline-block" />
                  </div>
                  <span className="text-xs font-bold text-white tracking-tight">Knowledge AI Workspace</span>
                </div>

                <div className="flex items-center gap-1 bg-[#131927] p-0.5 rounded-lg border border-[#2D3A54]">
                  <button
                    onClick={() => setActiveViewTab('chat')}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer',
                      activeViewTab === 'chat' ? 'bg-[#00F2FE] text-[#0A0E1A] font-bold shadow-xs' : 'text-slate-300 hover:text-white'
                    )}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Chat</span>
                  </button>
                  <button
                    onClick={() => setActiveViewTab('citations')}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer',
                      activeViewTab === 'citations' ? 'bg-[#00F2FE] text-[#0A0E1A] font-bold shadow-xs' : 'text-slate-300 hover:text-white'
                    )}
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Citations</span>
                  </button>
                  <button
                    onClick={() => setActiveViewTab('voice')}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer',
                      activeViewTab === 'voice' ? 'bg-[#00F2FE] text-[#0A0E1A] font-bold shadow-xs' : 'text-slate-300 hover:text-white'
                    )}
                  >
                    <Mic className="w-3 h-3" />
                    <span>Voice</span>
                  </button>
                </div>
              </div>

              {/* Preset Selector Chips */}
              <div className="p-3 bg-[#0A0E17]/60 border-b border-[#2D3A54] flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 shrink-0 mr-1">Demo Query:</span>
                {DEMO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setActivePresetId(preset.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                      activePresetId === preset.id
                        ? 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40 font-bold'
                        : 'bg-[#131927] text-slate-300 border border-[#2D3A54] hover:text-white'
                    )}
                  >
                    {preset.tabLabel}
                  </button>
                ))}
              </div>

              {/* Main Interactive Showcase Area */}
              <div className="p-5 space-y-4 bg-[#0A0E17]">
                {/* Search Query Input Mock */}
                <div className="p-3 rounded-xl bg-[#131927] border border-[#2D3A54] flex items-center gap-3">
                  <Search className="w-4 h-4 text-[#9D4EDD] shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-white flex-1 truncate">
                    {activePreset.query}
                  </span>
                  <Badge variant="cyan" size="sm">Gemini 2.5 Flash</Badge>
                </div>

                {/* Synthesis & Answer Output Container (No Sparkles Icon) */}
                <div className="p-4 rounded-xl bg-[#131927] border border-[#2D3A54] space-y-3.5 shadow-md">
                  <div className="flex items-center justify-between border-b border-[#2D3A54] pb-2.5">
                    <span className="font-bold text-[#00F2FE] text-xs uppercase font-mono flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#00F2FE]" /> AI Answer Synthesis
                    </span>
                    <Badge variant="primary" size="sm">Sub-2s Latency</Badge>
                  </div>

                  <p className="text-slate-100 text-xs sm:text-sm leading-relaxed font-medium">
                    {activePreset.answer}
                  </p>

                  {/* Code Block Showcase */}
                  <div className="rounded-xl bg-[#0A0E17] text-slate-100 p-3.5 font-mono text-[11px] leading-relaxed border border-[#2D3A54] space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-[#2D3A54]/50">
                      <span className="flex items-center gap-1 text-[#9D4EDD]">
                        <Terminal className="w-3 h-3" /> Python RAG Engine Code
                      </span>
                      <span className="text-[#00F2FE] font-bold">UTF-8</span>
                    </div>
                    <pre className="text-[#00F2FE] whitespace-pre-wrap pt-1 font-mono">
                      {activePreset.codeSnippet}
                    </pre>
                  </div>

                  {/* Citations Footnotes */}
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                      Grounded Source Footnotes
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activePreset.citations.map((c, idx) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0E1A] border border-[#2D3A54] text-xs font-semibold text-[#9D4EDD] hover:border-[#00F2FE] transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#00F2FE]" />
                          <span>[{idx + 1}] {c.title}</span>
                          <span className="text-[10px] font-mono text-slate-400">(p.{c.page})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Interactive Toolbar */}
                <div className="flex items-center justify-between pt-1 text-slate-400 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-[#00F2FE] transition-colors cursor-pointer"
                      title="Copy Output"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#00F2FE]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button className="text-slate-300 hover:text-[#9D4EDD] transition-colors cursor-pointer" title="Like">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button className="text-slate-300 hover:text-red-400 transition-colors cursor-pointer" title="Dislike">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                    <button className="text-slate-300 hover:text-white transition-colors cursor-pointer" title="Share">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setIsSpeaking(!isSpeaking)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                      isSpeaking
                        ? 'bg-[#00F2FE] text-[#0A0E1A] border-[#00F2FE] shadow-md shadow-cyan-500/25'
                        : 'bg-[#131927] border-[#9D4EDD]/40 text-[#9D4EDD] hover:bg-[#1A2336]'
                    )}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isSpeaking ? 'Speaking Speech...' : 'Listen Audio'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
