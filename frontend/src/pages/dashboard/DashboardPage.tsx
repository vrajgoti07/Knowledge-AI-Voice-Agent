// ============================================================
// DashboardPage — Bento Grid Overview (/dashboard)
// Minimalist Linear/Vercel Design with sleek metrics strip and asymmetric Bento Grid
// ============================================================

import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { motion, type Variants } from 'framer-motion'
import {
  MessageSquare, Upload, Mic, FileText,
  BarChart2, Clock, ArrowRight,
  RefreshCw, CheckCircle2, Server, Sparkles
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { apiGet } from '@/services/api'
import { toast } from '@/store/uiStore'

interface DailyQuery { date: string; queries: number }
interface Stats {
  totalDocuments: number
  activeConversations: number
  storageUsedMb: number
  queriesThisWeek: number
  dailyQueries: DailyQuery[]
}
interface RecentConv {
  id: string
  title: string
  updatedAt: string
  messages: { role: string; content: string }[]
}
interface RecentDoc {
  id: string
  title: string
  status: string
  fileType: string
  createdAt: string
  chunks: number
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' } }),
}

// Sleek Sparkline Chart (No inner heavy card)
function QuerySparkline({ data }: { data: DailyQuery[] }) {
  const maxVal = Math.max(...data.map(d => d.queries), 1)
  return (
    <div className="flex items-end gap-2 h-20 w-full pt-3">
      {data.map((d, i) => {
        const pct = Math.max((d.queries / maxVal) * 100, 8)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-[#3B82F6] to-[#38BDF8] opacity-80 group-hover:opacity-100 transition-all shadow-xs"
              style={{ height: `${pct}%`, minHeight: '6px' }}
              title={`${d.queries} queries on ${d.date}`}
            />
            <span className="text-[10px] text-slate-500 font-mono">{d.date}</span>
          </div>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ready:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    processing: 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse',
    uploading:  'bg-sky-500/10 text-sky-400 border-sky-500/20',
    error:      'bg-red-500/10 text-red-400 border-red-500/20',
    archived:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
  }
  return (
    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${map[status?.toLowerCase()] ?? map.archived}`}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Ready'}
    </span>
  )
}

function relativeTime(isoString: string): string {
  if (!isoString) return 'just now'
  let s = String(isoString).trim()
  if (!s.endsWith('Z') && !s.includes('+') && !s.includes('-', 10)) {
    s += 'Z'
  }
  const time = new Date(s).getTime()
  const diff = Math.floor((Date.now() - time) / 1000)
  if (isNaN(diff) || diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.role === 'admin'

  const [stats, setStats] = useState<Stats | null>(null)
  const [conversations, setConversations] = useState<RecentConv[]>([])
  const [documents, setDocuments] = useState<RecentDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'chats' | 'docs'>('chats')

  const fetchAll = async () => {
    if (isAdmin) return
    setLoading(true)
    try {
      const [s, convs, docs] = await Promise.all([
        apiGet<Stats>('/stats'),
        apiGet<RecentConv[]>('/conversations'),
        apiGet<RecentDoc[]>('/documents'),
      ])
      setStats(s)
      setConversations(convs.slice(0, 6))
      setDocuments(docs.slice(0, 6))
    } catch {
      toast.error('Error', 'Could not load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      fetchAll()
    }
  }, [isAdmin])

  if (isAdmin) {
    return <Navigate to={ROUTES.ADMIN} replace />
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8 text-[#F1F5F9] max-w-7xl mx-auto font-sans select-none">

      {/* ── 1. HEADER & QUICK ACTIONS (Consolidated Row) ───────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#F1F5F9] tracking-tight flex items-center gap-2.5">
            <span>Welcome back, {firstName}</span>
            <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Overview of your active knowledge base, research conversations, and system usage.
          </p>
        </div>

        {/* Sleek ButtonGroup aligned right */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white text-xs font-semibold shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-all cursor-pointer border border-blue-400/20 active:scale-[0.98]"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Start New Chat</span>
          </Link>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-slate-200 hover:text-white text-xs font-medium transition-all cursor-pointer active:scale-[0.98] shadow-xs"
          >
            <Upload className="w-4 h-4 text-sky-400" />
            <span>Attach Document</span>
          </Link>
          <Link
            to="/voice"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-violet-500/30 text-slate-200 hover:text-white text-xs font-medium transition-all cursor-pointer active:scale-[0.98] shadow-xs"
          >
            <Mic className="w-4 h-4 text-violet-400" />
            <span>Voice Session</span>
          </Link>
          <button
            type="button"
            onClick={fetchAll}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 2. METRICS STRIP (Elevated Glass Horizontal Bar) ─────── */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="glass-card p-5 shadow-2xl relative overflow-hidden"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          {/* Total Documents */}
          <div className="p-3 lg:px-6 lg:first:pl-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Documents</p>
              <FileText className="w-4 h-4 text-sky-400/80" />
            </div>
            <p className="text-2xl sm:text-3xl font-light text-white font-mono tabular-nums tracking-tight">
              {loading ? <span className="inline-block w-16 h-7 bg-white/5 rounded animate-pulse" /> : (stats?.totalDocuments ?? 0)}
            </p>
          </div>

          {/* Conversations */}
          <div className="p-3 lg:px-6 space-y-1.5 pt-4 lg:pt-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Conversations</p>
              <MessageSquare className="w-4 h-4 text-blue-400/80" />
            </div>
            <p className="text-2xl sm:text-3xl font-light text-white font-mono tabular-nums tracking-tight">
              {loading ? <span className="inline-block w-16 h-7 bg-white/5 rounded animate-pulse" /> : (stats?.activeConversations ?? 0)}
            </p>
          </div>

          {/* Storage Used */}
          <div className="p-3 lg:px-6 space-y-1.5 pt-4 lg:pt-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Storage Used</p>
              <BarChart2 className="w-4 h-4 text-violet-400/80" />
            </div>
            <p className="text-2xl sm:text-3xl font-light text-white font-mono tabular-nums tracking-tight">
              {loading ? <span className="inline-block w-16 h-7 bg-white/5 rounded animate-pulse" /> : `${stats?.storageUsedMb ?? 0} MB`}
            </p>
          </div>

          {/* Queries This Week */}
          <div className="p-3 lg:px-6 space-y-1.5 pt-4 lg:pt-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Queries This Week</p>
              <Sparkles className="w-4 h-4 text-emerald-400/80" />
            </div>
            <p className="text-2xl sm:text-3xl font-light text-white font-mono tabular-nums tracking-tight">
              {loading ? <span className="inline-block w-16 h-7 bg-white/5 rounded animate-pulse" /> : (stats?.queriesThisWeek ?? 0)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── 3. ASYMMETRIC BENTO GRID (Bottom Half) ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMN 1: Main Workspace Activity (Spans 2 columns) */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="lg:col-span-2 glass-card p-6 shadow-2xl space-y-5 flex flex-col justify-between"
        >
          <div className="space-y-4">
            {/* Header + Tabs UI */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
                <div className="flex items-center gap-1 bg-[#0A0E1A] p-1 rounded-lg border border-white/5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('chats')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      activeTab === 'chats'
                        ? 'bg-white/10 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Chats ({conversations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('docs')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      activeTab === 'docs'
                        ? 'bg-white/10 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Documents ({documents.length})
                  </button>
                </div>
              </div>

              <Link
                to="/chat"
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Content List (NO nested bordered cards — borderless clean <ul>) */}
            {loading ? (
              <div className="space-y-3 py-2">
                {[1,2,3,4].map(i => <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            ) : activeTab === 'chats' ? (
              conversations.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No recent conversations</p>
                  <Link to="/chat" className="text-xs text-sky-400 hover:underline inline-block">Start a chat session →</Link>
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {conversations.map(conv => {
                    const firstMsg = conv.messages?.find(m => m.role === 'user')?.content
                    const isDefault = !conv.title || conv.title === 'New Research Session' || conv.title === 'New Conversation'
                    return (
                      <li key={conv.id}>
                        <Link
                          to={`/chat/${conv.id}`}
                          className="group flex items-center justify-between gap-4 py-3 -mx-2 px-2 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className={`text-xs font-semibold truncate ${isDefault ? 'text-slate-400 italic' : 'text-white group-hover:text-sky-400 transition-colors'}`}>
                              {conv.title || 'New Research Session'}
                            </p>
                            {firstMsg && (
                              <p className="text-[11px] text-slate-500 truncate">{firstMsg}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 shrink-0">
                            <Clock className="w-3 h-3 text-slate-600" />
                            <span>{relativeTime(conv.updatedAt)}</span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )
            ) : (
              documents.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No documents uploaded yet</p>
                  <Link to="/chat" className="text-xs text-sky-400 hover:underline inline-block">Attach document in AI Chat →</Link>
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {documents.map(doc => (
                    <li key={doc.id}>
                      <Link
                        to="/chat"
                        className="group flex items-center justify-between gap-4 py-3 -mx-2 px-2 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                          <p className="text-xs font-semibold text-white truncate group-hover:text-sky-400 transition-colors">
                            {doc.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <StatusBadge status={doc.status} />
                          <span className="text-[10px] font-mono text-slate-500">{doc.chunks || 0} chunks</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        </motion.div>

        {/* COLUMN 2: Analytics & System (Spans 1 column) */}
        <div className="space-y-6 lg:col-span-1">

          {/* Panel 1: Query Activity */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="glass-card p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-sky-400" />
                Query Activity
              </h3>
              <span className="text-[10px] font-mono text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/5">7-Day Trend</span>
            </div>

            {loading || !stats ? (
              <div className="h-20 bg-white/5 rounded-lg animate-pulse" />
            ) : (
              <div className="space-y-2">
                <QuerySparkline data={stats.dailyQueries} />
                <p className="text-xs text-slate-400 text-center pt-2">
                  <span className="text-sky-400 font-semibold">{stats.queriesThisWeek}</span> queries processed this week
                </p>
              </div>
            )}
          </motion.div>

          {/* Panel 2: Knowledge Base Health */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="glass-card p-6 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                System Status
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <span>Operational</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">RAG Vector Engine:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Indexed Files:</span>
                <span className="font-mono text-slate-200">{stats?.totalDocuments ?? 0} active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Storage Backend:</span>
                <span className="font-mono text-slate-200">SQLite Vector DB</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

    </div>
  )
}
