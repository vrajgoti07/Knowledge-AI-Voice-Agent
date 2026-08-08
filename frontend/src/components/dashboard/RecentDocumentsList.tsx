// ============================================================
// RecentDocumentsList — Dynamic Documents Grid connected to useDocumentsStore
// Renders proper empty state for brand new user accounts
// ============================================================

import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, ArrowRight } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useDocumentsStore } from '@/store/documentsStore'

export function RecentDocumentsList() {
  const documents = useDocumentsStore((s) => s.documents)

  return (
    <Card className="p-5 space-y-4 bg-[#121A2C] border-[#1E293B]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#38BDF8]" />
          <h2 className="text-sm font-bold text-[#F1F5F9]">Recent Documents</h2>
        </div>
        <Link to={ROUTES.DOCUMENTS}>
          <Button variant="ghost" size="sm" className="text-xs text-[#38BDF8]" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            View all
          </Button>
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-white/10 rounded-xl bg-[#0A0E1A]">
          <FileText className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
          <p className="text-xs font-semibold text-[#F1F5F9]">No documents uploaded yet</p>
          <p className="text-[11px] text-[#94A3B8] mt-1">Upload a PDF, DOCX, or TXT document to begin RAG queries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents.slice(0, 6).map((doc) => (
            <div key={doc.id} className="p-3.5 rounded-lg border border-white/10 bg-[#0A0E1A] hover:border-[#38BDF8]/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-[#38BDF8] border border-white/10">
                  {doc.fileType}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                  {doc.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#F1F5F9] truncate" title={doc.title}>
                {doc.title}
              </p>
              <p className="text-[10px] text-[#64748B] font-mono mt-1">
                {doc.size} • {doc.vectorCount} vectors
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
