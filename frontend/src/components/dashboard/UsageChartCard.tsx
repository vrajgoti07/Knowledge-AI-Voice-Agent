// ============================================================
// UsageChartCard — Single Fixed-Height 7-Day Usage Chart (#2E5AAC)
// ============================================================

import React from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui'

const DATA_7D = [
  { day: 'Mon', queries: 245 },
  { day: 'Tue', queries: 380 },
  { day: 'Wed', queries: 310 },
  { day: 'Thu', queries: 520 },
  { day: 'Fri', queries: 460 },
  { day: 'Sat', queries: 640 },
  { day: 'Sun', queries: 410 },
]

export function UsageChartCard() {
  return (
    <Card className="p-5 space-y-4 bg-bg-card border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-text-primary">7-Day Query Activity</h2>
        </div>
        <span className="text-xs font-mono font-semibold text-text-muted">Total: 2,965 Queries</span>
      </div>

      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA_7D} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2E5AAC" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2E5AAC" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                fontSize: '12px',
                color: '#111827',
              }}
            />
            <Area
              type="monotone"
              dataKey="queries"
              name="AI Queries"
              stroke="#2E5AAC"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#chartGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
