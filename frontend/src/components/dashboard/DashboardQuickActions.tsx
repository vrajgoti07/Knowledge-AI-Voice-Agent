// ============================================================
// DashboardQuickActions — 3-4 Essential Trigger Buttons
// ============================================================

import React from 'react'
import { Link } from 'react-router-dom'
import { Plus, Upload, Mic, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui'
import { useUIStore } from '@/store/uiStore'
import { ROUTES } from '@/constants'

export function DashboardQuickActions() {
  const { setUploadModalOpen } = useUIStore()

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link to={ROUTES.CHAT}>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
          New Chat
        </Button>
      </Link>

      <Button
        variant="secondary"
        leftIcon={<Upload className="w-4 h-4 text-primary" />}
        onClick={() => setUploadModalOpen(true)}
      >
        Upload Document
      </Button>

      <Link to={ROUTES.VOICE}>
        <Button variant="secondary" leftIcon={<Mic className="w-4 h-4 text-primary" />}>
          Start Voice Session
        </Button>
      </Link>

    </div>
  )
}
