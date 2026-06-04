import { motion } from 'framer-motion'
import { Calendar, Pencil, Trash2, Tag } from 'lucide-react'

const statusConfig = {
  todo: { label: 'To Do', class: 'bg-slate-700/60 text-slate-400' },
  in_progress: { label: 'In Progress', class: 'bg-blue-500/15 text-blue-400 border border-blue-500/20' },
  done: { label: 'Done', class: 'bg-green-500/15 text-green-400 border border-green-500/20' },
}

const priorityConfig = {
  low: { class: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' },
  medium: { class: 'bg-amber-500/15 text-amber-400 border border-amber-500/20' },
  high: { class: 'bg-red-500/15 text-red-400 border border-red-500/20' },
}

export default function TaskCard({ task, onEdit, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -3, boxShadow: '0 0 20px rgba(139,92,246,0.1)' }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-white/8 p-5 transition-shadow duration-200"
      style={{ background: '#12121e' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${task.status === 'done' ? 'line-through text-slate-600' : 'text-white'}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-slate-600 text-sm mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(task)} className="p-1.5 hover:bg-primary-500/10 hover:text-primary-400 text-slate-600 rounded-lg transition-colors">
            <Pencil size={15} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-slate-600 rounded-lg transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className={`badge ${statusConfig[task.status].class}`}>{statusConfig[task.status].label}</span>
        <span className={`badge ${priorityConfig[task.priority].class}`}>{task.priority}</span>
        {task.category && (
          <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <Tag size={10} /> {task.category}
          </span>
        )}
        {task.due_date && (
          <span className="flex items-center gap-1 text-xs text-slate-600">
            <Calendar size={11} />
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </motion.div>
  )
}
