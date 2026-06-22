import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus, Search, X, ArrowUpAZ, ArrowDownAZ, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { getNotes, createNote, updateNote, deleteNote } from '../api/notes'
import NoteCard from '../components/notes/NoteCard'
import NoteModal from '../components/notes/NoteModal'
import NoteViewPage from '../components/notes/NoteViewPage'
import TextEditorPage from '../components/common/TextEditorPage'
import { NoteSkeleton } from '../components/common/SkeletonCard'
import Header from '../components/layout/Header'

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest', icon: Clock },
  { key: 'az', label: 'A → Z', icon: ArrowUpAZ },
  { key: 'za', label: 'Z → A', icon: ArrowDownAZ },
]

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [viewingNote, setViewingNote] = useState(null)
  const [textEditingNote, setTextEditingNote] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState('newest')
  const firstLoad = useRef(true)

  const fetchNotes = useCallback(async () => {
    try {
      const { data } = await getNotes()
      setNotes(data)
    } catch {
      toast.error('Failed to load notes')
    } finally {
      if (firstLoad.current) {
        firstLoad.current = false
        setPageLoading(false)
      }
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

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let result = q
      ? notes.filter(n =>
          n.title?.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q) ||
          n.category?.toLowerCase().includes(q)
        )
      : notes

    if (sortKey === 'az') result = [...result].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    else if (sortKey === 'za') result = [...result].sort((a, b) => (b.title || '').localeCompare(a.title || ''))

    return result
  }, [notes, searchQuery, sortKey])

  const pinned = filteredNotes.filter(n => n.is_pinned)
  const unpinned = filteredNotes.filter(n => !n.is_pinned)

  return (
    <div>
      <Header
        title="Notes"
        subtitle={`${filteredNotes.length} note${filteredNotes.length !== 1 ? 's' : ''}${searchQuery ? ` of ${notes.length}` : ''}`}
        action={
          <button onClick={() => { setEditingNote(null); setModalOpen(true) }} className="btn-primary">
            <Plus size={18} /> New Note
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-9 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
          {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortKey === key
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {pageLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <NoteSkeleton key={i} />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-600 text-lg">No notes yet</p>
          <p className="text-slate-700 text-sm mt-1">Create your first note to get started</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500 text-lg">No notes match &quot;{searchQuery}&quot;</p>
          <button onClick={() => setSearchQuery('')} className="text-purple-400 hover:text-purple-300 text-sm mt-2 transition-colors">
            Clear search
          </button>
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
