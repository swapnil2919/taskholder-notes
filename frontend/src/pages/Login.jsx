import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import {
  Mail, Lock, Database, ChevronDown,
  XCircle, AlertTriangle, ExternalLink, X, CheckCircle2,
  Settings2, Loader2,
} from 'lucide-react'
import spidermanGif from '../assets/Spiderman.gif'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/common/Spinner'
import { listDbConfigs, activateDbConfig } from '../api/dbConfigs'

function StarField() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 80 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 2 + 1 + 'px',
            height: Math.random() * 2 + 1 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            opacity: Math.random() * 0.7 + 0.1,
            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite ${Math.random() * 3}s`,
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 60%)' }}
      />
    </div>
  )
}

function DbErrorModal({ error, onClose }) {
  if (!error) return null
  const isFull = error.type === 'db_full'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative max-w-md w-full rounded-2xl p-6"
        style={{
          background: '#151525',
          border: `1px solid ${isFull ? 'rgba(251,146,60,0.35)' : 'rgba(239,68,68,0.35)'}`,
          boxShadow: `0 0 40px ${isFull ? 'rgba(251,146,60,0.12)' : 'rgba(239,68,68,0.12)'}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-600 hover:text-slate-300 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div
            className="mt-0.5 flex-shrink-0 p-2.5 rounded-xl"
            style={{ background: isFull ? 'rgba(251,146,60,0.1)' : 'rgba(239,68,68,0.1)' }}
          >
            {isFull
              ? <AlertTriangle size={22} className="text-orange-400" />
              : <XCircle size={22} className="text-red-400" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base mb-1">
              {isFull ? 'Database Storage Full' : 'Connection Failed'}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">{error.message}</p>
            {isFull && (
              <a
                href="https://neon.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-green-400 hover:text-green-300 transition-colors"
              >
                Create a new database on Neon
                <ExternalLink size={13} />
              </a>
            )}
            <button
              onClick={onClose}
              className="mt-4 w-full py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: isFull ? 'rgba(251,146,60,0.15)' : 'rgba(239,68,68,0.15)',
                color: isFull ? '#fb923c' : '#f87171',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function Login() {
  const { login, loading } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const [configs, setConfigs] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [dbDropdownOpen, setDbDropdownOpen] = useState(false)
  const [dbSwitching, setDbSwitching] = useState(false)
  const [dbError, setDbError] = useState(null)
  const [configsLoading, setConfigsLoading] = useState(true)

  useEffect(() => {
    listDbConfigs()
      .then(({ data }) => {
        setConfigs(data)
        const active = data.find(c => c.is_active)
        if (active) setSelectedId(active.id)
      })
      .catch(() => {})
      .finally(() => setConfigsLoading(false))
  }, [])

  const selectedConfig = configs.find(c => c.id === selectedId)

  const onSubmit = async (formData) => {
    // If user picked a different DB, switch it first
    const currentActive = configs.find(c => c.is_active)
    if (selectedId && selectedId !== currentActive?.id) {
      setDbSwitching(true)
      try {
        await activateDbConfig(selectedId)
        setDbError(null)
      } catch (err) {
        const detail = err.response?.data?.detail
        setDbError(
          typeof detail === 'object' && detail?.type
            ? detail
            : { type: 'connection_error', message: 'DB connection could not be established. Please enter valid credentials.' }
        )
        setDbSwitching(false)
        return
      } finally {
        setDbSwitching(false)
      }
    }

    await login({ email: formData.email, password: formData.password })
  }

  const isLoading = loading || dbSwitching

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0a14' }}>
      <StarField />

      <AnimatePresence>
        {dbError && <DbErrorModal error={dbError} onClose={() => setDbError(null)} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-5" style={{ width: 130, height: 130 }}>
            <img src={spidermanGif} alt="Spider-Man" style={{ width: 130, height: 130, objectFit: 'contain' }} />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-500 mt-1 text-sm">Sign in to your TaskHolder account</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8"
          style={{ boxShadow: '0 0 40px rgba(139,92,246,0.1)' }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  {...register('email', { required: 'Email is required' })}
                  type="email"
                  className="input-field pl-9"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type="password"
                  className="input-field pl-9"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Database Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-1.5">
                  <Database size={14} className="text-slate-500" />
                  Database
                </label>
                <Link
                  to="/databases"
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                >
                  <Settings2 size={11} />
                  Manage
                </Link>
              </div>

              {configsLoading ? (
                <div
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-600"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Loader2 size={14} className="animate-spin" />
                  Loading databases…
                </div>
              ) : configs.length === 0 ? (
                <div
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <span className="text-red-400 text-xs">No database configured</span>
                  <Link to="/databases" className="text-xs text-violet-400 hover:text-violet-300">
                    Add one →
                  </Link>
                </div>
              ) : (
                <div className="relative">
                  {/* Custom dropdown trigger */}
                  <button
                    type="button"
                    onClick={() => setDbDropdownOpen(v => !v)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${dbDropdownOpen ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      boxShadow: dbDropdownOpen ? '0 0 0 2px rgba(124,58,237,0.2)' : 'none',
                    }}
                  >
                    <Database size={14} className={selectedConfig ? 'text-violet-400' : 'text-slate-600'} />
                    <span className="flex-1 truncate text-white">
                      {selectedConfig ? selectedConfig.name : 'Select a database'}
                    </span>
                    {selectedConfig?.is_active && (
                      <CheckCircle2 size={13} className="text-green-400 flex-shrink-0" />
                    )}
                    <ChevronDown
                      size={14}
                      className="text-slate-500 flex-shrink-0 transition-transform"
                      style={{ transform: dbDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {/* Dropdown list */}
                  <AnimatePresence>
                    {dbDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20"
                        style={{
                          background: '#161628',
                          border: '1px solid rgba(255,255,255,0.1)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        }}
                      >
                        {configs.map(config => (
                          <button
                            key={config.id}
                            type="button"
                            onClick={() => {
                              setSelectedId(config.id)
                              setDbDropdownOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                            style={{
                              background: selectedId === config.id ? 'rgba(124,58,237,0.1)' : 'transparent',
                            }}
                          >
                            <Database
                              size={14}
                              className={config.is_active ? 'text-violet-400' : 'text-slate-600'}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white truncate">{config.name}</span>
                                {config.is_active && (
                                  <span className="text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 font-mono truncate">{config.host}</p>
                            </div>
                            {selectedId === config.id && (
                              <CheckCircle2 size={14} className="text-violet-400 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading || configs.length === 0}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
            >
              {isLoading && <Spinner size={17} />}
              {dbSwitching ? 'Connecting to DB…' : loading ? 'Signing in…' : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign up
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
