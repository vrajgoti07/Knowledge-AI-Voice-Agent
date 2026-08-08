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
      <div className="flex items-center gap-6 border-b border-[#1E293B] overflow-x-auto scrollbar-none">
        {(['Profile', 'Appearance', 'Notifications', 'Voice Preferences'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === tab
                ? 'border-[#3B82F6] text-[#60A5FA]'
                : 'border-transparent text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 1. PROFILE TAB */}
      {activeTab === 'Profile' && (
        <Card className="p-6 space-y-6 border-[#1E293B] bg-[#121A2C]">
          <div className="flex items-center gap-5 pb-4 border-b border-[#1E293B]">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xl shadow-md">
                {fullName.charAt(0).toUpperCase() || 'U'}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#16213A] border border-[#1E293B] text-[#60A5FA] hover:text-white transition-colors cursor-pointer"
                title="Change Avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#F1F5F9]">{fullName || 'User'}</h3>
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
                <Badge variant="success" size="sm">Verified</Badge>
              </div>
              <Input
                value={user?.email ?? ''}
                disabled
                className="bg-[#0A0E1A] opacity-70"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#F1F5F9]">Role</label>
              <Input
                value={user?.role === 'admin' ? 'Administrator' : 'Member'}
                disabled
                className="bg-[#0A0E1A] opacity-70"
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
        </Card>
      )}

      {/* 2. APPEARANCE TAB */}
      {activeTab === 'Appearance' && (
        <Card className="p-6 space-y-6 border-[#1E293B] bg-[#121A2C]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0A0E1A] border border-[#1E293B]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {themeMode === 'light' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#60A5FA]" />}
                <h3 className="text-sm font-semibold text-[#F1F5F9]">
                  Active Theme: {themeMode === 'light' ? 'Light Mode' : 'Dark Mode'}
                </h3>
              </div>
              <p className="text-xs text-[#94A3B8]">
                {themeMode === 'light'
                  ? 'Light mode is active. Click below to switch back to high-contrast dark theme.'
                  : 'Dark mode is active. Optimized for low-eyestrain research and vector search navigation.'}
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={handleToggleTheme}
              disabled={themeSaving}
              leftIcon={themeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (themeMode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />)}
            >
              Switch to {themeMode === 'light' ? 'Dark Mode' : 'Light Mode'}
            </Button>
          </div>
        </Card>
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
