// ============================================================
// Page 16 — Admin System Settings (/admin/settings)
// System-Level Tabs: General, Embedding & Models, Security, API Access & Modal Dialogs
// ============================================================

import React, { useState } from 'react'
import { Check, ShieldAlert, Key, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { Button, Card, Input, Badge, ToggleSwitch, Modal } from '@/components/ui'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'General' | 'Embedding & Models' | 'Security' | 'API Access'>('General')

  // General Tab State
  const [platformName, setPlatformName] = useState('Knowledge AI')
  const [kbLanguage, setKbLanguage] = useState('English (US)')
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  // Embedding Tab State
  const [embeddingModel, setEmbeddingModel] = useState('Embeddings-HNSW-v3')
  const [reindexConfirmOpen, setReindexConfirmOpen] = useState(false)

  // Security Tab State
  const [sessionTimeout, setSessionTimeout] = useState('60 minutes')
  const [require2FA, setRequire2FA] = useState(true)

  // API Access Tab State
  const [showApiKey, setShowApiKey] = useState(false)
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false)
  const [rateLimit, setRateLimit] = useState('120')
  const [apiKey, setApiKey] = useState('sk-live-knowledge-ai-894102948102948')

  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSaveTab = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const handleRegenerateApiKey = () => {
    setApiKey(`sk-live-knowledge-ai-${Math.random().toString(36).substring(2, 15)}`)
    setRegenerateConfirmOpen(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto bg-[#0A0E1A] text-[#F1F5F9]">
      {/* PAGE HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-[#F1F5F9]">System Settings</h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Configure platform-wide options.
        </p>
      </div>

      {/* HORIZONTAL TABS */}
      <div className="flex items-center gap-6 border-b border-[#1E293B] overflow-x-auto scrollbar-none">
        {(['General', 'Embedding & Models', 'Security', 'API Access'] as const).map((tab) => (
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

      {/* TAB CONTENT */}

      {/* 1. GENERAL TAB */}
      {activeTab === 'General' && (
        <Card className="p-6 space-y-6 border-[#1E293B]">
          <form onSubmit={handleSaveTab} className="space-y-5 max-w-md">
            <Input
              label="Platform Name"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#F1F5F9]">
                Default Knowledge-Base Language
              </label>
              <select
                value={kbLanguage}
                onChange={(e) => setKbLanguage(e.target.value)}
                className="w-full rounded-xl border border-[#1E293B] bg-[#0A0E1A] text-sm text-[#F1F5F9] px-3.5 py-2.5 outline-none focus:border-[#3B82F6]"
              >
                <option value="English (US)">English (US)</option>
                <option value="Spanish">Spanish</option>
                <option value="German">German</option>
                <option value="Multilingual Auto">Multilingual Auto-Detect</option>
              </select>
            </div>

            <div className="pt-2 border-t border-[#1E293B] space-y-2">
              <ToggleSwitch
                label="Maintenance Mode"
                description="Temporarily restrict non-admin users from creating new chat sessions."
                checked={maintenanceMode}
                onChange={setMaintenanceMode}
              />

              {maintenanceMode && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Warning: Maintenance mode is active. Users will see a maintenance banner.</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button type="submit" variant="primary">
                Save General Settings
              </Button>
              {savedSuccess && (
                <span className="text-xs text-[#22C55E] flex items-center gap-1 font-medium">
                  <Check className="w-4 h-4" /> Saved successfully
                </span>
              )}
            </div>
          </form>
        </Card>
      )}

      {/* 2. EMBEDDING & MODELS TAB */}
      {activeTab === 'Embedding & Models' && (
        <Card className="p-6 space-y-6 border-[#1E293B]">
          <form onSubmit={handleSaveTab} className="space-y-5 max-w-md">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#F1F5F9]">Default Embedding Model</label>
              <select
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
                className="w-full rounded-xl border border-[#1E293B] bg-[#0A0E1A] text-sm text-[#F1F5F9] px-3.5 py-2.5 outline-none focus:border-[#3B82F6]"
              >
                <option value="Embeddings-HNSW-v3">Embeddings-HNSW-v3 (Default 768-dim)</option>
                <option value="BGE-Large-EN-v1.5">BGE-Large-EN-v1.5 (1024-dim)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#F1F5F9]">Production LLM Engine</label>
              <Input
                value="Gemini 2.5 Flash (Google DeepMind)"
                disabled
                className="bg-[#121A2C] opacity-80 font-semibold text-[#60A5FA]"
              />
            </div>

            <div className="pt-4 border-t border-[#1E293B] space-y-2">
              <span className="eyebrow text-[10px] text-[#64748B]">Knowledge Vector Index Operations</span>
              <Button
                type="button"
                variant="ghost"
                leftIcon={<RefreshCw className="w-4 h-4 text-[#60A5FA]" />}
                onClick={() => setReindexConfirmOpen(true)}
              >
                Trigger Full Re-index
              </Button>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary">
                Save Model Options
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 3. SECURITY TAB */}
      {activeTab === 'Security' && (
        <Card className="p-6 space-y-6 border-[#1E293B]">
          <form onSubmit={handleSaveTab} className="space-y-5 max-w-md">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#F1F5F9]">Session Timeout Duration</label>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full rounded-xl border border-[#1E293B] bg-[#0A0E1A] text-sm text-[#F1F5F9] px-3.5 py-2.5 outline-none focus:border-[#3B82F6]"
              >
                <option value="30 minutes">30 minutes</option>
                <option value="60 minutes">60 minutes (1 Hour)</option>
                <option value="12 hours">12 hours</option>
              </select>
            </div>

            <ToggleSwitch
              label="Require 2FA for Admins"
              description="Enforce two-factor authentication for all users with administrator privileges."
              checked={require2FA}
              onChange={setRequire2FA}
            />

            <div className="space-y-2 pt-2 border-t border-[#1E293B]">
              <span className="eyebrow text-[10px] text-[#64748B]">Password Policy Summary</span>
              <ul className="text-xs text-[#94A3B8] space-y-1 list-disc list-inside">
                <li>Minimum length of 6 characters required</li>
                <li>Requires mixed alphanumeric characters</li>
                <li>Automatic session invalidation on password change</li>
              </ul>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary">
                Save Security Policy
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 4. API ACCESS TAB */}
      {activeTab === 'API Access' && (
        <Card className="p-6 space-y-6 border-[#1E293B]">
          <form onSubmit={handleSaveTab} className="space-y-5 max-w-md">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#F1F5F9]">Platform API Key</label>
              <div className="flex items-center gap-2">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  readOnly
                  className="font-mono text-xs bg-[#0A0E1A]"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2.5 rounded-xl border border-[#1E293B] bg-[#121A2C] text-[#60A5FA] hover:bg-[#16213A] cursor-pointer"
                  title="Reveal Key"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={<Key className="w-3.5 h-3.5" />}
                  onClick={() => setRegenerateConfirmOpen(true)}
                >
                  Regenerate API Key
                </Button>
              </div>
            </div>

            <Input
              label="API Rate Limit (Requests / minute)"
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button type="submit" variant="primary">
                Save API Access
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* CONFIRM RE-INDEX MODAL */}
      {reindexConfirmOpen && (
        <Modal
          open={reindexConfirmOpen}
          onOpenChange={setReindexConfirmOpen}
          title="Confirm Vector Re-index"
          description="Triggering a full re-index will re-embed all 100+ documents. This may take 5–10 minutes."
          maxWidth="sm"
        >
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setReindexConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => { setReindexConfirmOpen(false); alert('Full re-index triggered successfully!') }}>
              Start Full Re-index
            </Button>
          </div>
        </Modal>
      )}

      {/* CONFIRM REGENERATE API KEY MODAL */}
      {regenerateConfirmOpen && (
        <Modal
          open={regenerateConfirmOpen}
          onOpenChange={setRegenerateConfirmOpen}
          title="Regenerate API Key"
          description="Are you sure? Any existing external services using the previous API key will instantly lose access."
          maxWidth="sm"
        >
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setRegenerateConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRegenerateApiKey}>
              Regenerate Key
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
