// ============================================================
// Page 14 — Admin System Health (/admin/system-health)
// Standardized Stat Cards Row, 24h Response Time Chart & Detailed 6-Service Status List
// ============================================================

import React from 'react'
import { Activity, Clock, AlertCircle, ShieldCheck } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, Badge } from '@/components/ui'

const LATENCY_SERIES = [
  { time: '00:00', latency: 145 },
  { time: '04:00', latency: 160 },
  { time: '08:00', latency: 185 },
  { time: '12:00', latency: 150 },
  { time: '16:00', latency: 165 },
  { time: '20:00', latency: 140 },
  { time: '24:00', latency: 155 },
]

interface ServiceHealth {
  id: string
  name: string
  status: 'Operational' | 'Degraded' | 'Outage'
  uptimePct: number
  lastIncident: string
}

const SERVICES: ServiceHealth[] = [
  { id: 's1', name: 'Embedding Service',       status: 'Operational', uptimePct: 99.98, lastIncident: 'None (30d)' },
  { id: 's2', name: 'Vector DB (FAISS / HNSW)', status: 'Operational', uptimePct: 99.95, lastIncident: 'Sep 14, 2026' },
  { id: 's3', name: 'Auth Service',             status: 'Operational', uptimePct: 100.0,  lastIncident: 'None (90d)' },
  { id: 's4', name: 'Voice / STT Service',      status: 'Operational', uptimePct: 99.90, lastIncident: 'Oct 02, 2026' },
  { id: 's5', name: 'TTS Speech Engine',        status: 'Operational', uptimePct: 99.92, lastIncident: 'Sep 29, 2026' },
  { id: 's6', name: 'API Gateway',              status: 'Operational', uptimePct: 99.99, lastIncident: 'None (60d)' },
]

export default function AdminSystemHealthPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-[#0A0E1A] text-[#F1F5F9]">
      {/* PAGE HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-[#F1F5F9]">System Health</h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Real-time infrastructure and service monitoring.
        </p>
      </div>

      {/* TOP ROW: 4 STANDARDIZED STAT CARDS (matching SummaryStatsRow pattern) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 border-[#1E293B] bg-[#121A2C]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-[#94A3B8]">System Uptime</p>
            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
          </div>
          <p className="text-3xl font-semibold text-[#F1F5F9] tabular-nums mb-3">99.94%</p>
          <div className="h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{ v: 99.90 }, { v: 99.92 }, { v: 99.93 }, { v: 99.94 }]}>
                <Line type="monotone" dataKey="v" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <span className="text-xs text-[#22C55E] mt-2 inline-block font-medium">+0.02% vs last month</span>
        </Card>

        <Card className="p-5 border-[#1E293B] bg-[#121A2C]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-[#94A3B8]">Avg Response Time</p>
            <Clock className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <p className="text-3xl font-semibold text-[#F1F5F9] tabular-nums mb-3">158 ms</p>
          <div className="h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{ v: 180 }, { v: 165 }, { v: 170 }, { v: 158 }]}>
                <Line type="monotone" dataKey="v" stroke="#60A5FA" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <span className="text-xs text-[#60A5FA] mt-2 inline-block font-medium">Sub-200ms Target</span>
        </Card>

        <Card className="p-5 border-[#1E293B] bg-[#121A2C]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-[#94A3B8]">Error Rate</p>
            <Activity className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <p className="text-3xl font-semibold text-[#F1F5F9] tabular-nums mb-3">0.02%</p>
          <div className="h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{ v: 0.05 }, { v: 0.03 }, { v: 0.02 }, { v: 0.02 }]}>
                <Line type="monotone" dataKey="v" stroke="#60A5FA" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <span className="text-xs text-[#22C55E] mt-2 inline-block font-medium">Nominal Range</span>
        </Card>

        <Card className="p-5 border-[#1E293B] bg-[#121A2C]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-[#94A3B8]">Active Incidents</p>
            <AlertCircle className="w-4 h-4 text-[#22C55E]" />
          </div>
          <p className="text-3xl font-semibold text-[#F1F5F9] tabular-nums mb-3">0</p>
          <div className="h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }]}>
                <Line type="monotone" dataKey="v" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <span className="text-xs text-[#22C55E] mt-2 inline-block font-medium">All Services Operational</span>
        </Card>
      </div>

      {/* MIDDLE: RESPONSE TIME CHART CARD (LAST 24H) */}
      <Card className="p-6 space-y-4 border-[#1E293B]">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <h3 className="text-base font-semibold text-[#F1F5F9]">Response Time (Last 24h)</h3>
          <span className="font-mono text-xs text-[#60A5FA]">Target &lt; 200ms</span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={LATENCY_SERIES}>
              <defs>
                <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} domain={[100, 220]} />
              <Tooltip contentStyle={{ backgroundColor: '#121A2C', borderColor: '#1E293B', borderRadius: 12, color: '#F1F5F9', fontSize: 12 }} />
              <Area type="monotone" dataKey="latency" name="Latency (ms)" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#latencyGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* BELOW: DETAILED SERVICE STATUS LIST (6 DISTINCT SERVICES) */}
      <Card className="p-6 space-y-4 border-[#1E293B]">
        <h3 className="text-base font-semibold text-[#F1F5F9]">Detailed Service Infrastructure Status</h3>

        <div className="space-y-3">
          {SERVICES.map((s) => (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#0A0E1A] border border-[#1E293B] gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shrink-0" />
                <span className="text-xs font-semibold text-[#F1F5F9]">{s.name}</span>
              </div>

              <div className="flex items-center gap-6 text-xs text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <span>Uptime:</span>
                  <span className="font-mono font-semibold text-[#F1F5F9]">{s.uptimePct}%</span>
                </div>

                <div className="flex items-center gap-2">
                  <span>Last Incident:</span>
                  <span className="font-mono text-[#64748B]">{s.lastIncident}</span>
                </div>

                <Badge variant="success" size="sm">{s.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
