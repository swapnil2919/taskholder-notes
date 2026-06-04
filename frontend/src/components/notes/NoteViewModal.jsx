import { motion, AnimatePresence } from 'framer-motion'
import { X, Pin, Tag, Calendar, Pencil } from 'lucide-react'

export default function NoteViewModal({ isOpen, onClose, note, onEdit }) {
  if (!note) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl z-10 overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-8 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {note.is_pinned && (
                  <Pin size={16} className="text-primary-500 fill-primary-200 shrink-0" />
                )}
                <h2 className="text-2xl font-bold text-slate-800">{note.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content — scrollable */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {note.content ? (
                <p className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              ) : (
                <p className="text-slate-400 italic text-sm">No content</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                {note.category && (
                  <span className="badge bg-purple-100 text-purple-700 flex items-center gap-1">
                    <Tag size={10} /> {note.category}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar size={11} />
                  {new Date(note.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </span>
              </div>
              <button
                onClick={() => { onClose(); onEdit(note) }}
                className="btn-primary py-1.5 px-4 text-sm"
              >
                <Pencil size={14} /> Edit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
