import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { getNotes, createNote, updateNote, deleteNote } from '../api/notes'
import NoteCard from '../components/notes/NoteCard'
import NoteModal from '../components/notes/NoteModal'
import NoteViewModal from '../components/notes/NoteViewModal'
import Header from '../components/layout/Header'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [viewingNote, setViewingNote] = useState(null)

  const fetchNotes = useCallback(async () => {
    try {
      const { data } = await getNotes()
      setNotes(data)
    } catch {
      toast.error('Failed to load notes')
    }
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const handleSubmit = async (data) => {
    setLoading(true)
    try {
      if (editingNote) {
        await updateNote(editingNote.id, data)
        toast.success('Note updated!')
      } else {
        await createNote(data)
        toast.success('Note created!')
      }
      fetchNotes()
      setModalOpen(false)
      setEditingNote(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return
    try {
      await deleteNote(id)
      setNotes(prev => prev.filter(n => n.id !== id))
      toast.success('Note deleted')
    } catch {
      toast.error('Failed to delete note')
    }
  }

  const handleTogglePin = async (note) => {
    try {
      await updateNote(note.id, { is_pinned: !note.is_pinned })
      fetchNotes()
    } catch {
      toast.error('Failed to update note')
    }
  }

  const pinned = notes.filter(n => n.is_pinned)
  const unpinned = notes.filter(n => !n.is_pinned)

  return (
    <div>
      <Header
        title="Notes"
        subtitle={`${notes.length} note${notes.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => { setEditingNote(null); setModalOpen(true) }} className="btn-primary">
            <Plus size={18} /> New Note
          </button>
        }
      />

      {notes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">No notes yet</p>
          <p className="text-slate-300 text-sm mt-1">Create your first note to get started</p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">📌 Pinned</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {pinned.map(note => (
                    <NoteCard key={note.id} note={note} onView={n => setViewingNote(n)} onEdit={n => { setEditingNote(n); setModalOpen(true) }} onDelete={handleDelete} onTogglePin={handleTogglePin} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">All Notes</h3>}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {unpinned.map(note => (
                    <NoteCard key={note.id} note={note} onView={n => setViewingNote(n)} onEdit={n => { setEditingNote(n); setModalOpen(true) }} onDelete={handleDelete} onTogglePin={handleTogglePin} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </>
      )}

      <NoteModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingNote(null) }}
        onSubmit={handleSubmit}
        note={editingNote}
        loading={loading}
      />

      <NoteViewModal
        isOpen={!!viewingNote}
        onClose={() => setViewingNote(null)}
        note={viewingNote}
        onEdit={n => { setViewingNote(null); setEditingNote(n); setModalOpen(true) }}
      />
    </div>
  )
}
