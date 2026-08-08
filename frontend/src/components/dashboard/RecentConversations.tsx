// ============================================================
// RecentConversations — Dynamic Conversations List
// Renders proper empty state for brand new user accounts
// ============================================================

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { ROUTES } from '@/constants'
import { apiGet } from '@/services/api'

export interface RecentChat {
  id: string
  title: string
  lastMessage?: string
  timestamp: string
}

export function RecentConversations() {
  const [conversations, setConversations] = useState<RecentChat[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchConvs() {
      try {
        setLoading(true)
        const data = await apiGet<any[]>('/conversations')
        if (Array.isArray(data)) {
          setConversations(
            data.map((c) => ({
              id: c.id,
              title: c.title,
              lastMessage: c.messages?.[c.messages.length - 1]?.content || 'Started research session',
              timestamp: c.updatedAt || 'Recent',
            }))
          )
        }
      } catch (err) {
        setConversations([])
      } finally {
        setLoading(false)
      }
    }
    fetchConvs()
  }, [])

  return (
    <Card className="p-5 space-y-4 bg-[#121A2C] border-[#1E293B]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#38BDF8]" />
          <h2 className="text-sm font-bold text-[#F1F5F9]">Recent Conversations</h2>
        </div>
        <Link to={ROUTES.HISTORY}>
          <Button variant="ghost" size="sm" className="text-xs text-[#38BDF8]" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            View all
          </Button>
        </Link>
      </div>

      {conversations.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-white/10 rounded-xl bg-[#0A0E1A]">
          <MessageSquare className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
          <p className="text-xs font-semibold text-[#F1F5F9]">No conversations yet</p>
          <p className="text-[11px] text-[#94A3B8] mt-1">Start by asking a question or uploading a document.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {conversations.slice(0, 5).map((chat) => (
            <Link
              key={chat.id}
              to={`${ROUTES.CHAT}/${chat.id}`}
              className="block py-3 hover:bg-white/[0.03] px-2.5 rounded-lg transition-colors group"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#F1F5F9] group-hover:text-[#38BDF8] transition-colors truncate">
                  {chat.title}
                </p>
                <span className="text-[10px] font-mono text-[#64748B] shrink-0">{chat.timestamp}</span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1 line-clamp-1">
                {chat.lastMessage}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}
