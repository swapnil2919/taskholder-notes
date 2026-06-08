import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Save } from 'lucide-react'

export default function TextEditorPage({ item, onClose, onSave, loading, textLabel = 'content' }) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (item) {
      setTitle(item.title || '')
      setText(item.description ?? item.content ?? '')
    }
  }, [item])

  if (!item) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#0a0a14' }}
    >
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-white/8 sticky top-0 z-10"
        style={{ background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(20px)' }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={17} /> Cancel
        </button>
        <button
          onClick={() => onSave({ title, text })}
          disabled={loading || !title.trim()}
          className="btn-primary py-1.5 px-5 text-sm disabled:opacity-40"
        >
          <Save size={14} /> {loading ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 pt-8 pb-24 flex flex-col">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title..."
            className="w-full text-3xl font-bold text-white bg-transparent border-none outline-none placeholder-slate-700"
          />
          <div className="my-5 border-t border-white/5" />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Write your ${textLabel}...`}
            className="w-full text-[15px] text-slate-300 bg-transparent border-none outline-none resize-none leading-7 placeholder-slate-700"
            style={{ minHeight: 'calc(100vh - 220px)' }}
          />
        </div>
      </div>
    </motion.div>
  )
}
