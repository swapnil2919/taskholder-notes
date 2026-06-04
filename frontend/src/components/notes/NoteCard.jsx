import { motion } from 'framer-motion'
import { Pin, Pencil, Trash2, Tag, Eye } from 'lucide-react'

export default function NoteCard({ note, onEdit, onDelete, onTogglePin, onView }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, boxShadow: note.is_pinned ? '0 0 25px rgba(139,92,246,0.15)' : '0 0 20px rgba(139,92,246,0.08)' }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border p-5 relative transition-shadow duration-200 ${note.is_pinned ? 'border-primary-500/30' : 'border-white/8'}`}
      style={{ background: '#12121e' }}
    >
      {note.is_pinned && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
          <Pin size={12} className="text-white fill-white" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white line-clamp-1 flex-1">{note.title}</h3>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onTogglePin(note)}
            className={`p-1.5 rounded-lg transition-colors ${note.is_pinned ? 'text-primary-400 bg-primary-500/10' : 'hover:bg-white/5 text-slate-600'}`}
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={14} />
          </button>
          <button onClick={() => onView(note)} className="p-1.5 hover:bg-cyan-500/10 hover:text-cyan-400 text-slate-600 rounded-lg transition-colors" title="View">
            <Eye size={14} />
          </button>
          <button onClick={() => onEdit(note)} className="p-1.5 hover:bg-primary-500/10 hover:text-primary-400 text-slate-600 rounded-lg transition-colors" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(note.id)} className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-slate-600 rounded-lg transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        {note.category && (
          <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <Tag size={10} /> {note.category}
          </span>
        )}
        <span className="text-xs text-slate-700 ml-auto">
          {new Date(note.created_at).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  )
}
