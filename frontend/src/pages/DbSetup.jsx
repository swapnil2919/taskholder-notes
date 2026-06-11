import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import {
  Database, Plus, Trash2, CheckCircle2, AlertTriangle,
  XCircle, ExternalLink, ArrowLeft, RefreshCw, Loader2,
} from 'lucide-react'
import { listDbConfigs, addDbConfig, deleteDbConfig, activateDbConfig } from '../api/dbConfigs'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function StarField() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 2 + 1 + 'px',
            height: Math.random() * 2 + 1 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            opacity: Math.random() * 0.5 + 0.1,
            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite ${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  )
}

function ErrorAlert({ error, onClose }) {
  if (!error) return null
  const isFull = error.type === 'db_full'
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-3 rounded-xl p-4"
      style={{
        background: isFull ? 'rgba(251,146,60,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${isFull ? 'rgba(251,146,60,0.25)' : 'rgba(239,68,68,0.25)'}`,
      }}
    >
      {isFull
        ? <AlertTriangle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
        : <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: isFull ? '#fb923c' : '#f87171' }}>{error.message}</p>
        {isFull && (
          <a
            href="https://neon.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-xs text-green-400 hover:text-green-300"
          >
            Create a new database on Neon <ExternalLink size={11} />
          </a>
        )}
      </div>
      <button onClick={onClose} className="text-slate-600 hover:text-slate-400 flex-shrink-0">
        <XCircle size={15} />
      </button>
    </motion.div>
  )
}

function DbCard({ config, onDelete, onActivate, activating }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Remove "${config.name}" from the list?`)) return
    setDeleting(true)
    try {
      await onDelete(config.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="flex items-center gap-4 rounded-xl px-4 py-3.5"
      style={{
        background: config.is_active ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${config.is_active ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: config.is_active ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)' }}
      >
        <Database size={16} className={config.is_active ? 'text-violet-400' : 'text-slate-500'} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{config.name}</span>
          {config.is_active && (
            <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full flex-shrink-0">
              <CheckCircle2 size={10} /> Active
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 font-mono truncate mt-0.5">{config.host}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {!config.is_active && (
          <button
            onClick={() => onActivate(config.id)}
            disabled={activating === config.id}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-60"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}
          >
            {activating === config.id
              ? <span className="flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Connecting…</span>
              : 'Use this'
            }
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
        >
          {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        </button>
      </div>
    </motion.div>
  )
}

export default function DbSetup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const [configs, setConfigs] = useState([])
  const [fetchError, setFetchError] = useState(null)
  const [addError, setAddError] = useState(null)
  const [activateError, setActivateError] = useState(null)
  const [adding, setAdding] = useState(false)
  const [activating, setActivating] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchConfigs = useCallback(async () => {
    try {
      const { data } = await listDbConfigs()
      setConfigs(data)
      setFetchError(null)
    } catch {
      setFetchError('Failed to load database list.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfigs() }, [fetchConfigs])

  const onAdd = async (formData) => {
    setAdding(true)
    setAddError(null)
    try {
      await addDbConfig(formData.name.trim(), formData.url.trim())
      toast.success(`"${formData.name}" added successfully`)
      reset()
      await fetchConfigs()
    } catch (err) {
      const detail = err.response?.data?.detail
      setAddError(
        typeof detail === 'object' && detail?.type
          ? detail
          : { type: 'connection_error', message: 'Failed to add database.' }
      )
    } finally {
      setAdding(false)
    }
  }

  const onDelete = async (id) => {
    try {
      await deleteDbConfig(id)
      toast.success('Database removed')
      await fetchConfigs()
    } catch {
      toast.error('Failed to remove database')
    }
  }

  const onActivate = async (id) => {
    setActivating(id)
    setActivateError(null)
    try {
      const { data } = await activateDbConfig(id)
      toast.success(data.message)
      await fetchConfigs()
    } catch (err) {
      const detail = err.response?.data?.detail
      setActivateError(
        typeof detail === 'object' && detail?.type
          ? detail
          : { type: 'connection_error', message: 'Failed to activate database.' }
      )
    } finally {
      setActivating(null)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0a0a14' }}>
      <StarField />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Database size={22} className="text-violet-400" />
              Database Manager
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Add and switch between Neon PostgreSQL databases</p>
          </div>
          <button
            onClick={fetchConfigs}
            className="ml-auto p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Add Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-6"
          style={{ boxShadow: '0 0 30px rgba(124,58,237,0.08)' }}
        >
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Plus size={15} className="text-violet-400" />
            Add New Database
          </h2>

          <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Display Name</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="input-field"
                  placeholder="e.g. Production DB"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Connection URL</label>
                <input
                  {...register('url', { required: 'URL is required' })}
                  className="input-field font-mono text-xs"
                  placeholder="postgresql+asyncpg://user:pass@host/dbname"
                />
                {errors.url && <p className="text-red-400 text-xs mt-1">{errors.url.message}</p>}
                <div
                  className="mt-2 rounded-lg px-3 py-2.5 space-y-1"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <p className="text-xs text-slate-500 font-medium">Example format:</p>
                  <p className="text-xs font-mono break-all leading-relaxed" style={{ color: '#a78bfa' }}>
                    postgresql+asyncpg://
                    <span className="text-yellow-400">user_name</span>
                    :
                    <span className="text-green-400">password</span>
                    @
                    <span className="text-cyan-400">ep-polished-field-ap26xxnp-pooler.c-7.us-east-1.aws.neon.tech</span>
                    /
                    <span className="text-orange-400">neondb</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Copy from Neon dashboard → your project → <span className="text-slate-500">Connection Details</span> → select <span className="text-slate-500">Pooled connection</span>
                  </p>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {addError && <ErrorAlert error={addError} onClose={() => setAddError(null)} />}
            </AnimatePresence>

            <div className="flex items-center gap-3">
              <motion.button
                type="submit"
                disabled={adding}
                whileHover={{ scale: adding ? 1 : 1.02 }}
                whileTap={{ scale: adding ? 1 : 0.98 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-70 transition-all"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}
              >
                {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {adding ? 'Validating & Adding…' : 'Add Database'}
              </motion.button>
              <p className="text-xs text-slate-600">
                The URL is validated and tables are auto-created before saving.
              </p>
            </div>
          </form>
        </motion.div>

        {/* Saved Databases List */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
          style={{ boxShadow: '0 0 30px rgba(124,58,237,0.08)' }}
        >
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Database size={15} className="text-violet-400" />
            Saved Databases
            {configs.length > 0 && (
              <span className="ml-auto text-xs text-slate-600">{configs.length} total</span>
            )}
          </h2>

          <AnimatePresence>
            {activateError && (
              <div className="mb-4">
                <ErrorAlert error={activateError} onClose={() => setActivateError(null)} />
              </div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-600">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : fetchError ? (
            <p className="text-sm text-red-400 text-center py-6">{fetchError}</p>
          ) : configs.length === 0 ? (
            <div className="text-center py-10">
              <Database size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No databases added yet.</p>
              <p className="text-xs text-slate-600 mt-1">Add your first Neon database URL above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {configs.map(config => (
                  <DbCard
                    key={config.id}
                    config={config}
                    onDelete={onDelete}
                    onActivate={onActivate}
                    activating={activating}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {!user && (
          <p className="text-center text-sm text-slate-600 mt-6">
            Done?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">
              Back to Login
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
