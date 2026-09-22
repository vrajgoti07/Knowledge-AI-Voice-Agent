// ============================================================
// PersonalLibraryPage (/personal-library)
// Saved Answers, Bookmarked Documents (reads from useDocumentsStore), My Notes (persisted)
// ============================================================

import React, { useState, useEffect } from 'react'
import { Bookmark, FileText, Trash2, Plus, Edit3, MessageSquare, ExternalLink } from 'lucide-react'
import { Button, Card, Modal, Input, Textarea } from '@/components/ui'
import { useDocumentsStore } from '@/store/documentsStore'
import { toast } from '@/store/uiStore'

interface SavedAnswer {
  id: string
  question: string
  answer: string
  citation?: string
  savedDate: string
}

interface Note {
  id: string
  title: string
  content: string
  updatedAt: string
}

const LOCAL_STORAGE_NOTES = 'knowledge_ai_notes'
const LOCAL_STORAGE_SAVED_ANSWERS = 'knowledge_ai_saved_answers'

export default function PersonalLibraryPage() {
  const [activeTab, setActiveTab] = useState<'Saved Answers' | 'Bookmarked Documents' | 'My Notes'>('Saved Answers')
  const [answers, setAnswers] = useState<SavedAnswer[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SAVED_ANSWERS)
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_NOTES)
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  const { documents, fetchDocuments } = useDocumentsStore()

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Save notes to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTES, JSON.stringify(notes))
    } catch { /* empty */ }
  }, [notes])

  // Save answers to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SAVED_ANSWERS, JSON.stringify(answers))
    } catch { /* empty */ }
  }, [answers])

  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteTitle.trim()) return

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }

    setNotes([newNote, ...notes])
    setNoteTitle('')
    setNoteContent('')
    setNoteModalOpen(false)
    toast.success('Note Created', 'Your personal research note has been saved.')
  }

  const handleDeleteAnswer = (id: string) => {
    setAnswers(answers.filter((a) => a.id !== id))
    toast.info('Answer Removed', 'Saved answer deleted.')
  }

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id))
    toast.info('Note Removed', 'Research note deleted.')
  }

  // Filter bookmarked documents from documentsStore (documents with bookmarked=true or all ready docs)
  const bookmarkedDocs = documents.filter((d: any) => d.bookmarked || d.status === 'ready')

  return (
    <div className="space-y-8 text-[#F1F5F9] max-w-7xl mx-auto">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9] tracking-tight flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-[#38BDF8]" />
            Personal Library
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Bookmarked research answers, saved document snippets, and custom notes.
          </p>
        </div>

        {activeTab === 'My Notes' && (
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setNoteModalOpen(true)}
          >
            Create Note
          </Button>
        )}
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 w-fit">
        {(['Saved Answers', 'Bookmarked Documents', 'My Notes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none ${
              activeTab === tab
                ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white shadow-sm shadow-blue-500/25'
                : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.04]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: SAVED ANSWERS */}
      {activeTab === 'Saved Answers' && (
        <div className="space-y-4">
          {answers.length === 0 ? (
            <div className="py-16 text-center glass-card border-dashed border-white/15 space-y-2 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto text-slate-500 shadow-inner">
                <Bookmark className="w-6 h-6 text-[#64748B] opacity-70" />
              </div>
              <p className="text-xs font-semibold text-[#F1F5F9]">No saved answers yet</p>
              <p className="text-[11px] text-[#94A3B8]">Save key AI responses from your research chat sessions.</p>
            </div>
          ) : (
            answers.map((item) => (
              <div key={item.id} className="glass-card p-6 space-y-3 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#3B82F6]" />
                    {item.question}
                  </h3>
                  <button
                    onClick={() => handleDeleteAnswer(item.id)}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-[#CBD5E1] leading-relaxed bg-[#0A0E1A]/70 p-4 rounded-xl border border-white/[0.06]">
                  {item.answer}
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#38BDF8]">
                  <span>Citation: {item.citation || 'AI Grounded Search'}</span>
                  <span className="text-[#64748B]">{item.savedDate}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: BOOKMARKED DOCUMENTS */}
      {activeTab === 'Bookmarked Documents' && (
        <div className="space-y-4">
          {bookmarkedDocs.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#1E293B] rounded-2xl bg-[#121A2C] space-y-2">
              <FileText className="w-10 h-10 text-[#64748B] mx-auto opacity-50" />
              <p className="text-xs font-semibold text-[#F1F5F9]">No bookmarked documents</p>
              <p className="text-[11px] text-[#94A3B8]">Upload and index knowledge files in your workspace.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarkedDocs.map((doc: any) => (
                <Card key={doc.id} className="p-5 border-[#1E293B] bg-[#121A2C] space-y-3 hover:border-[#38BDF8]/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                      {doc.fileType || 'PDF'}
                    </span>
                    <span className="text-[10px] font-semibold text-success">Ready</span>
                  </div>
                  <p className="text-sm font-bold text-[#F1F5F9] truncate">{doc.title}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#1E293B] text-[10px] text-[#64748B] font-mono">
                    <span>{doc.size || '0 KB'}</span>
                    <span>{doc.chunks || doc.vectorCount || 0} chunks</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY NOTES */}
      {activeTab === 'My Notes' && (
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#1E293B] rounded-2xl bg-[#121A2C] space-y-2">
              <Edit3 className="w-10 h-10 text-[#64748B] mx-auto opacity-50" />
              <p className="text-xs font-semibold text-[#F1F5F9]">No custom notes created</p>
              <p className="text-[11px] text-[#94A3B8]">Click 'Create Note' to record research observations and findings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {notes.map((note) => (
                <Card key={note.id} className="p-5 border-[#1E293B] bg-[#121A2C] space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#F1F5F9]">{note.title}</h3>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 rounded text-[#64748B] hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </div>
                  <p className="text-[10px] font-mono text-[#64748B] text-right pt-2 border-t border-[#1E293B]">{note.updatedAt}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NOTE MODAL */}
      <Modal
        open={noteModalOpen}
        onOpenChange={setNoteModalOpen}
        title="Create Personal Note"
        description="Record key takeaways and research observations."
      >
        <form onSubmit={handleCreateNote} className="space-y-4">
          <Input
            label="Note Title"
            placeholder="e.g. Key Takeaways from RAG Paper"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            required
          />

          <Textarea
            label="Content"
            placeholder="Write your research notes here..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={5}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Note
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
