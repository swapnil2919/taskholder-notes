import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Pencil, Tag, Pin, Calendar, Settings, FileText, ChevronDown } from 'lucide-react'

function renderLine(line, idx) {
  const parts = line.split(/(\*\*[^*]+\*\*)/)
  return (
    <span key={idx}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
          : part
      )}
    </span>
  )
}

function RichText({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  const nodes = []
  let bulletGroup = []

  const flushBullets = () => {
    if (bulletGroup.length) {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="list-none pl-0 my-1">
          {bulletGroup.map((b, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="text-primary-400 mt-0.5 shrink-0">•</span>
              <span>{renderLine(b, i)}</span>
            </li>
          ))}
        </ul>
      )
      bulletGroup = []
    }
  }

  lines.forEach((line, i) => {
    if (line.startsWith('• ')) {
      bulletGroup.push(line.slice(2))
    } else {
      flushBullets()
      nodes.push(<span key={i} className="block">{renderLine(line, i)}{'​'}</span>)
    }
  })
  flushBullets()

  return <div className="text-slate-400 text-[15px] leading-7 whitespace-pre-wrap">{nodes}</div>
}

export default function NoteViewPage({ note, onClose, onEditConfig, onEditText }) {
  const [editMenuOpen, setEditMenuOpen] = useState(false)

  if (!note) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-40 flex flex-col"
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
          <ArrowLeft size={17} /> Back to Notes
        </button>

        <div className="relative">
          <button
            onClick={() => setEditMenuOpen(v => !v)}
            className="btn-primary py-1.5 px-4 text-sm"
          >
            <Pencil size={13} /> Edit
            <ChevronDown size={13} className={`transition-transform duration-200 ${editMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {editMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setEditMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 overflow-hidden z-20"
                  style={{ background: '#12121e', boxShadow: '0 0 30px rgba(0,0,0,0.6)' }}
                >
                  <button
                    onClick={() => { setEditMenuOpen(false); onEditConfig(note) }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                  >
                    <Settings size={15} className="text-primary-400 shrink-0" />
                    <div>
                      <div className="font-medium">Edit Configuration</div>
                      <div className="text-xs text-slate-600 mt-0.5">Category, pin status…</div>
                    </div>
                  </button>
                  <div className="h-px bg-white/5" />
                  <button
                    onClick={() => { setEditMenuOpen(false); onEditText(note) }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                  >
                    <FileText size={15} className="text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-medium">Edit Text</div>
                      <div className="text-xs text-slate-600 mt-0.5">Title &amp; content</div>
                    </div>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-5">
            {note.is_pinned && <Pin size={18} className="text-primary-400 shrink-0 fill-current" />}
            <h1 className="text-3xl font-bold text-white leading-tight">{note.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-8">
            {note.category && (
              <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                <Tag size={10} /> {note.category}
              </span>
            )}
            {note.is_pinned && (
              <span className="badge bg-primary-500/15 text-primary-400 border border-primary-500/20">
                Pinned
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-600 ml-auto">
              <Calendar size={11} />
              {new Date(note.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {note.content ? (
            <RichText text={note.content} />
          ) : (
            <p className="text-slate-700 italic text-sm">
              No content — click Edit &gt; Edit Text to add some.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
