// ============================================================
// VoiceModal — Shared AI Voice Assistant Overlay
// ============================================================

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Volume2, ArrowRight } from 'lucide-react'
import { Modal, Button, Badge } from '@/components/ui'
import { useUIStore } from '@/store/uiStore'
import { ROUTES } from '@/constants'

export function VoiceModal() {
  const navigate = useNavigate()
  const { voiceModalOpen, setVoiceModalOpen } = useUIStore()
  const [isListening, setIsListening] = useState(true)

  const handleOpenFullPage = () => {
    setVoiceModalOpen(false)
    navigate(ROUTES.VOICE)
  }

  return (
    <Modal
      open={voiceModalOpen}
      onOpenChange={setVoiceModalOpen}
      title="Voice Research Assistant"
      description="Speak your question directly to query your RAG vector store."
    >
      <div className="space-y-6 text-center py-2">
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <button
            onClick={() => setIsListening(!isListening)}
            className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-hover transition-colors cursor-pointer"
          >
            {isListening ? <Mic className="w-8 h-8 animate-pulse" /> : <MicOff className="w-8 h-8" />}
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-text-primary">
            {isListening ? 'Listening... Speak your research question' : 'Voice paused. Click mic to resume'}
          </p>
          <p className="text-[11px] text-text-muted">
            "Summarize yesterday's paper on HNSW vector indexing..."
          </p>
        </div>

        <div className="p-3 rounded-lg bg-bg-secondary border border-border text-left text-xs space-y-1">
          <p className="text-[10px] font-mono text-primary font-semibold uppercase flex items-center gap-1">
            <Volume2 className="w-3 h-3" /> Voice Output Preview
          </p>
          <p className="text-text-secondary text-[11px]">
            HNSW uses multi-layer proximity graphs to achieve O(log N) vector retrieval latencies...
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="secondary" onClick={() => setVoiceModalOpen(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={handleOpenFullPage}
          >
            Open Full Voice Mode
          </Button>
        </div>
      </div>
    </Modal>
  )
}
