import { motion } from 'framer-motion'
import { Pin, Pencil, Trash2, Tag } from 'lucide-react'

export default function NoteCard({ note, onEdit, onDelete, onTogglePin }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`card hover:shadow-md transition-shadow duration-200 relative ${note.is_pinned ? 'ring-2 ring-primary-200' : ''}`}
    >
      {note.is_pinned && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
          <Pin size={12} className="text-white fill-white" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-800 line-clamp-1 flex-1">{note.title}</h3>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onTogglePin(note)}
            className={`p-1.5 rounded-lg transition-colors ${note.is_pinned ? 'text-primary-600 bg-primary-50' : 'hover:bg-slate-100 text-slate-400'}`}
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={14} />
          </button>
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {note.content && (
        <p className="text-slate-500 text-sm mt-2 line-clamp-4 whitespace-pre-wrap">{note.content}</p>
      )}

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
        {note.category && (
          <span className="badge bg-purple-100 text-purple-700 flex items-center gap-1">
            <Tag size={10} /> {note.category}
          </span>
        )}
        <span className="text-xs text-slate-400 ml-auto">
          {new Date(note.created_at).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  )
}
