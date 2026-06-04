import { motion } from 'framer-motion'
import { Calendar, Pencil, Trash2, Tag } from 'lucide-react'

const statusColors = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
}

const priorityColors = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

const statusLabels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }

export default function TaskCard({ task, onEdit, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="card hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-slate-800 truncate ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-slate-500 text-sm mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className={`badge ${statusColors[task.status]}`}>{statusLabels[task.status]}</span>
        <span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span>
        {task.category && (
          <span className="badge bg-purple-100 text-purple-700 flex items-center gap-1">
            <Tag size={10} /> {task.category}
          </span>
        )}
        {task.due_date && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar size={11} />
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </motion.div>
  )
}
