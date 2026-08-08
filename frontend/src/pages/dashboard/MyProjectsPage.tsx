// ============================================================
// MyProjectsPage (/projects)
// Projects as named collections of specific documents + conversations
// Linked item counters + project detail modal + strict name validation & success toast
// ============================================================

import React, { useState } from 'react'
import { Folder, Plus, FileText, MessageSquare, X, Eye, Trash2, CheckCircle2 } from 'lucide-react'
import { Button, Card, Input, Textarea, Modal } from '@/components/ui'
import { toast } from '@/store/uiStore'

interface LinkedItem {
  id: string
  title: string
  type: 'document' | 'conversation'
}

interface Project {
  id: string
  name: string
  description: string
  updatedAt: string
  status: 'Active' | 'Archived'
  linkedItems: LinkedItem[]
}

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [nameError, setNameError] = useState('')

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()

    if (!trimmed) {
      setNameError('Project name is required')
      return
    }
    if (trimmed.length > 50) {
      setNameError('Project name must be 50 characters or fewer')
      return
    }

    setNameError('')

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: trimmed,
      description: description.trim() || 'Named collection of documents and RAG research conversations.',
      updatedAt: 'Just now',
      status: 'Active',
      linkedItems: [],
    }

    setProjects([newProject, ...projects])
    setName('')
    setDescription('')
    setNewModalOpen(false)
    toast.success('Project Created', `"${newProject.name}" has been created successfully.`)
  }

  const handleDeleteProject = (id: string, projName: string) => {
    setProjects(projects.filter(p => p.id !== id))
    if (selectedProject?.id === id) setSelectedProject(null)
    toast.info('Project Deleted', `"${projName}" was removed.`)
  }

  return (
    <div className="space-y-8 text-[#F1F5F9] max-w-7xl mx-auto">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9] tracking-tight flex items-center gap-3">
            <Folder className="w-8 h-8 text-[#38BDF8]" />
            My Projects
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Group related documents and AI conversations into dedicated research collections.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => { setNameError(''); setNewModalOpen(true) }}
        >
          Create Project
        </Button>
      </div>

      {/* PROJECTS GRID & EMPTY STATE */}
      {projects.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-[#1E293B] rounded-2xl bg-[#121A2C] space-y-3">
          <Folder className="w-12 h-12 text-[#64748B] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[#F1F5F9]">No research projects created yet</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
            Projects let you group specific documents and chat conversations together for targeted RAG scoping.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-[#38BDF8] border-[#38BDF8]/40 hover:bg-[#38BDF8]/10 mt-2"
            onClick={() => { setNameError(''); setNewModalOpen(true) }}
          >
            + Create First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const docCount = proj.linkedItems.filter(i => i.type === 'document').length
            const convCount = proj.linkedItems.filter(i => i.type === 'conversation').length

            return (
              <Card
                key={proj.id}
                className="p-6 border-[#1E293B] bg-[#121A2C] flex flex-col justify-between gap-5 hover:border-[#38BDF8]/40 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center">
                      <Folder className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
                      {proj.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#F1F5F9] group-hover:text-[#38BDF8] transition-colors truncate">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#1E293B]">
                  <div className="flex items-center gap-4 text-xs font-mono text-[#94A3B8]">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      {docCount} Docs
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-[#3B82F6]" />
                      {convCount} Chats
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#64748B]">{proj.updatedAt}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedProject(proj)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#38BDF8] hover:bg-[#1E293B] transition-colors cursor-pointer"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj.id, proj.name)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* NEW PROJECT MODAL */}
      <Modal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        title="Create Research Project"
        description="Named collection of specific documents and chat sessions."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <Input
              label="Project Name"
              placeholder="e.g., Quantum Computing Papers 2026"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError('') }}
              required
            />
            {nameError && (
              <p className="text-xs text-red-400 mt-1">{nameError}</p>
            )}
          </div>

          <Textarea
            label="Description"
            placeholder="Describe the objective of this document & conversation collection..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setNewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* PROJECT DETAIL MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#121A2C] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-[#F1F5F9]">{selectedProject.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="text-[#64748B] hover:text-[#F1F5F9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-[#94A3B8]">
              <p className="text-[#F1F5F9] leading-relaxed">{selectedProject.description}</p>

              <div className="space-y-2">
                <h4 className="font-semibold text-[#F1F5F9] uppercase tracking-wider text-[11px]">Linked Documents & Conversations</h4>
                {selectedProject.linkedItems.length === 0 ? (
                  <p className="p-4 rounded-xl bg-[#0A0E1A] border border-[#1E293B] italic text-center text-[#64748B]">
                    No items linked to this project yet. Add documents from Knowledge Base or save chats here.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedProject.linkedItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0A0E1A] border border-[#1E293B]">
                        {item.type === 'document' ? <FileText className="w-4 h-4 text-[#8B5CF6]" /> : <MessageSquare className="w-4 h-4 text-[#3B82F6]" />}
                        <span className="text-[#F1F5F9] truncate flex-1">{item.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#1E293B] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 rounded-xl bg-[#1E293B] text-xs font-semibold text-[#F1F5F9] hover:bg-[#334155] transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
