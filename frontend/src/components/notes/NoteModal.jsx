import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'

export default function NoteModal({ isOpen, onClose, onSubmit, note, loading }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (note) {
      reset({ title: note.title, content: note.content || '', category: note.category || '', is_pinned: note.is_pinned })
    } else {
      reset({ title: '', content: '', category: '', is_pinned: false })
    }
  }, [note, isOpen, reset])

  const handleFormSubmit = (data) => {
    onSubmit({ ...data, content: data.content || null, category: data.category || null })
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
              <h2 className="text-xl font-bold text-white">{note ? 'Edit Note' : 'New Note'}</h2>
              <button onClick={onClose} className="p-1.5 hover:bg-white/10 text-slate-500 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Title *</label>
                <input {...register('title', { required: 'Title is required' })} className="input-field" placeholder="Note title" />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Content</label>
                <textarea {...register('content')} className="input-field resize-none" rows={5} placeholder="Write your note..." />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                  <input {...register('category')} className="input-field" placeholder="e.g. Ideas" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-6">
                  <input type="checkbox" {...register('is_pinned')} className="w-4 h-4 rounded accent-purple-500" />
                  <span className="text-sm font-medium text-slate-400">Pin</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                  {loading ? 'Saving...' : note ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
