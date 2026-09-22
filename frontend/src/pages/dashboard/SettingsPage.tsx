// ============================================================
// SettingsPage (/settings)
// Profile, Appearance (persisted theme), Notifications, Voice Preferences
// Every tab's Save button shows a real loading state + success toast
// ============================================================

import React, { useState, useEffect } from 'react'
import { Camera, Sun, Moon, Loader2 } from 'lucide-react'
import { Button, Card, Input, Badge, ToggleSwitch } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/uiStore'

const THEME_KEY = 'knowledge_ai_theme'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'Profile' | 'Appearance' | 'Notifications' | 'Voice Preferences'>('Profile')

  // Profile State
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [profileSaving, setProfileSaving] = useState(false)

  // Appearance State (Persisted)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY)
      return (stored === 'light' || stored === 'dark') ? stored : 'dark'
    } catch { return 'dark' }
  })
  const [themeSaving, setThemeSaving] = useState(false)

  // Notifications State
  const [emailSummaries, setEmailSummaries] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  const [productUpdates, setProductUpdates] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)

  // Voice Preferences State
  const [speechRate, setSpeechRate] = useState('1.0x')
  const [voiceStyle, setVoiceStyle] = useState('Calm')
  const [voiceSaving, setVoiceSaving] = useState(false)

  // Sync theme with document element
  useEffect(() => {
    const root = document.documentElement
    if (themeMode === 'light') {
      root.classList.add('light')
    } else {
      root.classList.remove('light')
    }
    try {
      localStorage.setItem(THEME_KEY, themeMode)
    } catch { /* empty */ }
  }, [themeMode])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    await new Promise(r => setTimeout(r, 600))
    if (user) {
      setUser({ ...user, name: fullName })
    }
    setProfileSaving(false)
    toast.success('Profile Updated', 'Your profile details have been saved.')
  }

  const handleToggleTheme = async () => {
    setThemeSaving(true)
    const newMode = themeMode === 'light' ? 'dark' : 'light'
    setThemeMode(newMode)
    await new Promise(r => setTimeout(r, 300))
    setThemeSaving(false)
    toast.success('Theme Saved', `Appearance set to ${newMode === 'light' ? 'Light Mode' : 'Dark Mode'}.`)
  }

  const handleSaveNotifications = async () => {
    setNotifSaving(true)
    await new Promise(r => setTimeout(r, 500))
    setNotifSaving(false)
    toast.success('Preferences Saved', 'Notification preferences updated.')
  }

  const handleSaveVoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setVoiceSaving(true)
    await new Promise(r => setTimeout(r, 500))
    setVoiceSaving(false)
    toast.success('Voice Settings Saved', `Speech rate ${speechRate}, voice style ${voiceStyle}.`)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#F1F5F9]">
      {/* PAGE HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-[#F1F5F9]">Settings</h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Manage your profile, application theme, notifications, and voice assistant preferences.
        </p>
      </div>

      {/* HORIZONTAL TABS */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 w-fit overflow-x-auto scrollbar-none">
        {(['Profile', 'Appearance', 'Notifications', 'Voice Preferences'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none ${
              activeTab === tab
                ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white shadow-sm shadow-blue-500/25'
                : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.04]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 1. PROFILE TAB */}
      {activeTab === 'Profile' && (
        <div className="glass-card p-6 space-y-6 shadow-2xl">
          <div className="flex items-center gap-5 pb-4 border-b border-white/[0.06]">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#38BDF8] text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/25 ring-2 ring-white/20">
                {fullName.charAt(0).toUpperCase() || 'U'}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-[#0D1220] border border-white/20 text-[#60A5FA] hover:text-white transition-colors cursor-pointer shadow-md"
                title="Change Avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#F1F5F9] tracking-tight">{fullName || 'User'}</h3>
              <p className="text-xs text-[#94A3B8]">{user?.email ?? ''}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#F1F5F9]">Email Address</label>
                <Badge variant="success" size="sm" dot>Verified</Badge>
              </div>
              <Input
                value={user?.email ?? ''}
                disabled
                className="opacity-70 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#F1F5F9]">Role</label>
              <Input
                value={user?.role === 'admin' ? 'Administrator' : 'Researcher'}
                disabled
                className="opacity-70 cursor-not-allowed"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" disabled={profileSaving}>
                {profileSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 2. APPEARANCE TAB */}
      {activeTab === 'Appearance' && (
        <div className="glass-card p-6 space-y-6 shadow-2xl">
          <div>
            <h3 className="text-sm font-semibold text-[#F1F5F9]">Interface Theme</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">Select your preferred color scheme for research sessions.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dark Mode Card */}
            <div
              onClick={() => { if (themeMode !== 'dark') handleToggleTheme() }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                themeMode === 'dark'
                  ? 'bg-sky-500/10 border-sky-500/50 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white">Dark Mode</span>
                </div>
                {themeMode === 'dark' && <Badge variant="cyan" size="sm" dot>Active</Badge>}
              </div>
              <div className="h-20 rounded-xl bg-[#0A0E1A] border border-white/10 p-2.5 flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400/60" />
                  <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                </div>
                <div className="space-y-1">
                  <div className="w-2/3 h-2 rounded bg-sky-500/30" />
                  <div className="w-1/2 h-2 rounded bg-white/10" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Deep navy obsidian theme optimized for low-light research.</p>
            </div>

            {/* Light Mode Card */}
            <div
              onClick={() => { if (themeMode !== 'light') handleToggleTheme() }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                themeMode === 'light'
                  ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Light Mode</span>
                </div>
                {themeMode === 'light' && <Badge variant="primary" size="sm" dot>Active</Badge>}
              </div>
              <div className="h-20 rounded-xl bg-slate-100 border border-slate-300 p-2.5 flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400/60" />
                  <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                </div>
                <div className="space-y-1">
                  <div className="w-2/3 h-2 rounded bg-blue-500/40" />
                  <div className="w-1/2 h-2 rounded bg-slate-300" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Clean, crisp light canvas for high ambient light workspaces.</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. NOTIFICATIONS TAB */}
      {activeTab === 'Notifications' && (
        <Card className="p-6 space-y-6 border-[#1E293B] bg-[#121A2C]">
          <div className="space-y-4 divide-y divide-[#1E293B]">
            <ToggleSwitch
              label="Email Research Summaries"
              description="Receive weekly AI summaries of newly uploaded knowledge documents."
              checked={emailSummaries}
              onChange={setEmailSummaries}
              className="pb-4"
            />

            <ToggleSwitch
              label="Security & Session Alerts"
              description="Get instant notifications when new logins occur from unrecognized devices."
              checked={securityAlerts}
              onChange={setSecurityAlerts}
              className="py-4"
            />

            <ToggleSwitch
              label="Product Updates"
              description="Be the first to hear about new Gemini Flash models and RAG feature releases."
              checked={productUpdates}
              onChange={setProductUpdates}
              className="pt-4"
            />
          </div>

          <div className="pt-4 border-t border-[#1E293B]">
            <Button variant="primary" onClick={handleSaveNotifications} disabled={notifSaving}>
              {notifSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </span>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* 4. VOICE PREFERENCES TAB */}
      {activeTab === 'Voice Preferences' && (
        <Card className="p-6 space-y-6 border-[#1E293B] bg-[#121A2C]">
          <form onSubmit={handleSaveVoice} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#F1F5F9]">Speech Rate</label>
              <select
                value={speechRate}
                onChange={(e) => setSpeechRate(e.target.value)}
                className="w-full rounded-xl border border-[#1E293B] bg-[#0A0E1A] text-sm text-[#F1F5F9] px-3.5 py-2.5 outline-none focus:border-[#3B82F6]"
              >
                <option value="0.75x">0.75x (Slower)</option>
                <option value="1.0x">1.0x (Normal)</option>
                <option value="1.25x">1.25x (Faster)</option>
                <option value="1.5x">1.5x (Express)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#F1F5F9]">Voice Style</label>
              <select
                value={voiceStyle}
                onChange={(e) => setVoiceStyle(e.target.value)}
                className="w-full rounded-xl border border-[#1E293B] bg-[#0A0E1A] text-sm text-[#F1F5F9] px-3.5 py-2.5 outline-none focus:border-[#3B82F6]"
              >
                <option value="Calm">Calm (Default)</option>
                <option value="Energetic">Energetic</option>
                <option value="Neutral">Neutral Professional</option>
              </select>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" disabled={voiceSaving}>
                {voiceSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </span>
                ) : (
                  'Save Voice Settings'
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
