// ============================================================
// SummaryStatsRow — Dynamic Real Data Stat Cards Row
// Connected to useDocumentsStore for Real User Document Counts
// ============================================================

import { Card } from '@/components/ui/Card'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { useDocumentsStore } from '@/store/documentsStore'

export function SummaryStatsRow() {
  const documents = useDocumentsStore((s) => s.documents)
  const docCount = documents.length
  const activeCount = documents.filter((d) => d.active).length

  const stats = [
    {
      label: 'Vectorized Documents',
      value: docCount,
      delta: docCount > 0 ? `${docCount} ready in DB` : '0 uploaded',
      sparkline: [{ v: 0 }, { v: docCount }],
    },
    {
      label: 'Active RAG Contexts',
      value: activeCount,
      delta: activeCount > 0 ? `${activeCount} active for queries` : 'None active',
      sparkline: [{ v: 0 }, { v: activeCount }],
    },
    {
      label: 'Total Vector Embeddings',
      value: documents.reduce((acc, d) => acc + d.vectorCount, 0),
      delta: docCount > 0 ? 'Grounded in Qdrant' : '0 vectors',
      sparkline: [{ v: 0 }, { v: documents.reduce((acc, d) => acc + d.vectorCount, 0) }],
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5 border-[#1E293B] bg-[#121A2C]">
          <p className="text-sm text-[#94A3B8] mb-2">{stat.label}</p>
          <p className="text-3xl font-semibold text-[#F1F5F9] tabular-nums mb-3">
            {stat.value}
          </p>
          <div className="h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stat.sparkline}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <span className="text-xs text-[#38BDF8] mt-2 inline-block font-medium">{stat.delta}</span>
        </Card>
      ))}
    </div>
  )
}
