// ============================================================
// Page 11 — Admin Models (/admin/models)
// Connected to Real FastAPI GET /api/v1/admin/models
// Displays active Gemini 2.5 Flash LLM & sentence-transformers Embedding Model
// ============================================================

import { useState, useEffect } from 'react'
import { Cpu, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui'
import { apiGet } from '@/services/api'

interface ModelConfig {
  llm: string
  embeddingModel: string
  vectorDim: number
  distanceMetric: string
}

export default function AdminModelsPage() {
  const [config, setConfig] = useState<ModelConfig>({
    llm: 'Gemini 2.5 Flash',
    embeddingModel: 'all-MiniLM-L6-v2',
    vectorDim: 384,
    distanceMetric: 'Cosine',
  })

  useEffect(() => {
    async function fetchModelConfig() {
      try {
        const data = await apiGet<ModelConfig>('/admin/models')
        setConfig(data)
      } catch (err) {
        // Fallback default config
      }
    }
    fetchModelConfig()
  }, [])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-[#0A0E1A] text-[#F1F5F9]">
      {/* PAGE HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-[#F1F5F9]">AI Models & Embedding Engine</h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Active Large Language Model and Vector Embedding configuration.
        </p>
      </div>

      {/* ACTIVE MODELS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LLM Card */}
        <Card className="p-6 border-[#1E293B] bg-[#121A2C] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9]">{config.llm}</h3>
                <p className="text-xs text-[#64748B] font-mono">Primary Generative RAG LLM</p>
              </div>
            </div>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-xs font-semibold text-[#22C55E]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active</span>
            </span>
          </div>

          <p className="text-xs text-[#94A3B8] leading-relaxed">
            High-speed multimodal LLM optimized for dense context RAG synthesis, token streaming, and source citation extraction.
          </p>

          <div className="pt-3 border-t border-white/5 font-mono text-xs text-[#94A3B8] flex justify-between">
            <span>Provider: Google Cloud AI</span>
            <span>Version: Flash 2.5</span>
          </div>
        </Card>

        {/* Embedding Model Card */}
        <Card className="p-6 border-[#1E293B] bg-[#121A2C] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9]">{config.embeddingModel}</h3>
                <p className="text-xs text-[#64748B] font-mono">Dense Vector Embeddings</p>
              </div>
            </div>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-xs font-semibold text-[#22C55E]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active</span>
            </span>
          </div>

          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Sentence-transformers model mapping text chunks into {config.vectorDim}-dimensional dense vector space for HNSW similarity retrieval.
          </p>

          <div className="pt-3 border-t border-white/5 font-mono text-xs text-[#94A3B8] flex justify-between">
            <span>Vector Dimensions: {config.vectorDim}d</span>
            <span>Distance: {config.distanceMetric}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
