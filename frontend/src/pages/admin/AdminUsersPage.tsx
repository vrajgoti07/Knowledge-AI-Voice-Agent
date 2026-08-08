// ============================================================
// Page 13 — Admin Users (/admin/users)
// Connected to Real FastAPI GET /api/v1/admin/users
// Shows accurate single admin user on clean system seed
// ============================================================

import { useState, useEffect } from 'react'
import { Users, Plus, Search, UserCheck, UserX, Shield } from 'lucide-react'
import { Button, Card, Input, Badge } from '@/components/ui'
import { apiGet } from '@/services/api'
import type { User } from '@/types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        const data = await apiGet<User[]>('/admin/users')
        if (Array.isArray(data)) {
          setUsers(data)
        }
      } catch (err) {
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-[#0A0E1A] text-[#F1F5F9]">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F1F5F9]">Team & User Access</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Manage user accounts, roles, and administrative permissions.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-[#38BDF8]" />}
          />
        </div>
      </div>

      {/* USERS TABLE */}
      <Card className="p-0 border-[#1E293B] bg-[#121A2C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F1F5F9]">
            <thead className="bg-[#0A0E1A] border-b border-white/10 text-[11px] font-mono text-[#94A3B8] uppercase">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#64748B]">
                    No registered users matching search query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white font-bold flex items-center justify-center text-xs">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#F1F5F9] font-sans">{u.name}</p>
                        <p className="text-[11px] text-[#64748B]">{u.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                        {u.plan}
                      </span>
                    </td>
                    <td className="p-4 text-[#94A3B8]">{new Date(u.createdAt).toLocaleDateString()}</td>
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
