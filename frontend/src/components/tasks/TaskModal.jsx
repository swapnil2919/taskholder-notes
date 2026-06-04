import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'

export default function TaskModal({ isOpen, onClose, onSubmit, task, loading }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        category: task.category || '',
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      })
    } else {
      reset({ title: '', description: '', status: 'todo', priority: 'medium', category: '', due_date: '' })
    }
  }, [task, isOpen, reset])

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
      description: data.description || null,
      category: data.category || null,
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative rounded-2xl w-full max-w-md p-6 z-10 border border-white/10"
            style={{ background: '#12121e', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{task ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={onClose} className="p-1.5 hover:bg-white/10 text-slate-500 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Title *</label>
                <input {...register('title', { required: 'Title is required' })} className="input-field" placeholder="Task title" />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <textarea {...register('description')} className="input-field resize-none" rows={3} placeholder="Optional description" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                  <select {...register('status')} className="input-field">
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Priority</label>
                  <select {...register('priority')} className="input-field">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                  <input {...register('category')} className="input-field" placeholder="e.g. Work" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Due Date</label>
                  <input type="date" {...register('due_date')} className="input-field" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                  {loading ? 'Saving...' : task ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
