import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { getNotes, createNote, updateNote, deleteNote } from '../api/notes'
import NoteCard from '../components/notes/NoteCard'
import NoteModal from '../components/notes/NoteModal'
import NoteViewPage from '../components/notes/NoteViewPage'
import TextEditorPage from '../components/common/TextEditorPage'
import Header from '../components/layout/Header'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [viewingNote, setViewingNote] = useState(null)
  const [textEditingNote, setTextEditingNote] = useState(null)

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
        if (viewingNote?.id === editingNote.id) {
          setViewingNote(prev => ({ ...prev, ...data }))
        }
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

  const handleEdit = (note) => {
    setEditingNote(note)
    setModalOpen(true)
  }

  const handleTextSave = async ({ title, text }) => {
    setLoading(true)
    try {
      await updateNote(textEditingNote.id, { title, content: text })
      toast.success('Note updated!')
      fetchNotes()
      setViewingNote(prev => prev ? { ...prev, title, content: text } : prev)
      setTextEditingNote(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
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
          <p className="text-slate-600 text-lg">No notes yet</p>
          <p className="text-slate-700 text-sm mt-1">Create your first note to get started</p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">📌 Pinned</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {pinned.map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onView={setViewingNote}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">All Notes</h3>}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {unpinned.map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onView={setViewingNote}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onTogglePin={handleTogglePin}
                    />
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

      <AnimatePresence>
        {viewingNote && !textEditingNote && (
          <NoteViewPage
            note={viewingNote}
            onClose={() => setViewingNote(null)}
            onEditConfig={handleEdit}
            onEditText={note => setTextEditingNote(note)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {textEditingNote && (
          <TextEditorPage
            item={textEditingNote}
            onClose={() => setTextEditingNote(null)}
            onSave={handleTextSave}
            loading={loading}
            textLabel="content"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
