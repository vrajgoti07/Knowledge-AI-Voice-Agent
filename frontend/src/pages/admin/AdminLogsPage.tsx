// ============================================================
// Page 15 — Admin Logs (/admin/logs)
// Connected to Real FastAPI GET /api/v1/admin/logs
// Displays real application logs with search & level filters
// ============================================================

import { useState, useEffect } from 'react'
import { FileText, Search } from 'lucide-react'
import { Card, Input } from '@/components/ui'
import { apiGet } from '@/services/api'

interface LogEntry {
  timestamp: string
  level: string
  message: string
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchLogs() {
      try {
        const data = await apiGet<LogEntry[]>('/admin/logs')
        if (Array.isArray(data)) setLogs(data)
      } catch (err) {
        setLogs([])
      }
    }
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(
    (l) =>
      l.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.level.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-[#0A0E1A] text-[#F1F5F9]">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F1F5F9]">System Audit Logs</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Search and inspect backend runtime logs and audit entries.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-[#38BDF8]" />}
          />
        </div>
      </div>

      {/* LOGS TABLE */}
      <Card className="p-0 border-[#1E293B] bg-[#121A2C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-[#F1F5F9]">
            <thead className="bg-[#0A0E1A] border-b border-white/10 text-[11px] text-[#94A3B8] uppercase">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Level</th>
                <th className="p-4">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-[#64748B]">
                    No system logs matching search query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="p-4 text-[#94A3B8] shrink-0">{l.timestamp}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                        {l.level}
                      </span>
                    </td>
                    <td className="p-4 text-[#F1F5F9]">{l.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
