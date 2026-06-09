import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Bold, List } from 'lucide-react'

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

  function applyBold() {
    const el = textareaRef.current
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = text.slice(start, end)

    let newText, newStart, newEnd
    if (selected) {
      const isBold = selected.startsWith('**') && selected.endsWith('**') && selected.length > 4
      if (isBold) {
        const inner = selected.slice(2, -2)
        newText = text.slice(0, start) + inner + text.slice(end)
        newStart = start
        newEnd = start + inner.length
      } else {
        newText = text.slice(0, start) + `**${selected}**` + text.slice(end)
        newStart = start
        newEnd = end + 4
      }
    } else {
      newText = text.slice(0, start) + '****' + text.slice(end)
      newStart = start + 2
      newEnd = start + 2
    }

    setText(newText)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(newStart, newEnd)
    })
  }

  function applyBullet() {
    const el = textareaRef.current
    const start = el.selectionStart
    const end = el.selectionEnd

    const beforeStart = text.lastIndexOf('\n', start - 1) + 1
    const afterEnd = text.indexOf('\n', end)
    const blockEnd = afterEnd === -1 ? text.length : afterEnd

    const block = text.slice(beforeStart, blockEnd)
    const lines = block.split('\n')

    const allBulleted = lines.every(l => l.startsWith('• '))
    const newLines = allBulleted
      ? lines.map(l => l.slice(2))
      : lines.map(l => (l.startsWith('• ') ? l : `• ${l}`))

    const newBlock = newLines.join('\n')
    const newText = text.slice(0, beforeStart) + newBlock + text.slice(blockEnd)
    const delta = newBlock.length - block.length

    setText(newText)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + (allBulleted ? -2 : 2), end + delta)
    })
  }

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

      {/* Formatting toolbar */}
      <div
        className="flex items-center gap-1 px-6 py-2 border-b border-white/5"
        style={{ background: 'rgba(10,10,20,0.9)' }}
      >
        <button
          onMouseDown={e => { e.preventDefault(); applyBold() }}
          title="Bold (select text first)"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors font-bold text-sm"
        >
          <Bold size={15} />
        </button>
        <button
          onMouseDown={e => { e.preventDefault(); applyBullet() }}
          title="Bullet list (select lines)"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
        >
          <List size={15} />
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
            style={{ minHeight: 'calc(100vh - 260px)' }}
          />
        </div>
      </div>
    </motion.div>
  )
}
