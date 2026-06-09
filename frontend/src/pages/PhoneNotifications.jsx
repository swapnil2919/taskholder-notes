import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone, Download, Copy, RefreshCw, Trash2, CheckCheck,
  Circle, Wifi, WifiOff, Bell, BellOff, ChevronDown, ChevronUp,
  Terminal, Package, Shield, Play,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import {
  getPhoneToken, regenerateToken, getConnectionStatus,
  getNotifications, markRead, deleteNotification,
  clearAllNotifications,
} from '../api/phoneNotifications'

const POLL_INTERVAL = 8000 // 8 seconds

const STEPS = [
  {
    icon: Package,
    title: 'Install Termux & Termux:API',
    desc: 'Install both apps on your Android phone from F-Droid (recommended) or Play Store.',
    detail: (
      <div className="space-y-2 text-sm text-slate-400">
        <p>1. Install <span className="text-cyan-400">Termux</span> — terminal emulator for Android</p>
        <p>2. Install <span className="text-cyan-400">Termux:API</span> — gives Termux access to phone APIs</p>
        <p className="text-amber-400/80 text-xs">⚠ Use F-Droid versions for best compatibility</p>
      </div>
    ),
  },
  {
    icon: Shield,
    title: 'Grant Notification Access',
    desc: 'Allow Termux:API to read your notifications in Android Settings.',
    detail: (
      <div className="space-y-2 text-sm text-slate-400">
        <p>Go to: <span className="text-white">Settings → Apps → Special app access → Notification access</span></p>
        <p>Enable <span className="text-cyan-400">Termux:API</span> in the list</p>
      </div>
    ),
  },
  {
    icon: Terminal,
    title: 'Setup Python in Termux',
    desc: 'Open Termux and run these two commands.',
    detail: (
      <div className="space-y-3">
        <CodeBlock code="pkg install python termux-api" />
        <CodeBlock code="pip install requests" />
      </div>
    ),
  },
  {
    icon: Download,
    title: 'Download & Transfer Script',
    desc: 'Easiest: download directly inside Termux using curl — no file transfer needed.',
    detail: (
      <div className="space-y-3 text-sm text-slate-400">
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-2">
          <p className="text-xs font-semibold text-green-400">✅ Recommended — Download directly in Termux</p>
          <p className="text-xs text-slate-400">Copy the curl command from the <span className="text-white">"Your Script"</span> section below and paste it in Termux. The script will be saved directly to the home folder.</p>
        </div>

        <p className="text-xs font-semibold text-slate-300 pt-1">Alternative — Browser download:</p>
        <p>1. Click <span className="text-white">Download taskholder_notify.py</span> button below</p>
        <p>2. File saves to <span className="text-cyan-400">Downloads</span> folder</p>
        <p>3. In Termux, run once to allow storage access:</p>
        <CodeBlock code="termux-setup-storage" />
        <p className="text-xs text-slate-500">☝ Tap <span className="text-white">Allow</span> on the permission popup</p>
        <p>4. Move file to Termux home:</p>
        <CodeBlock code="mv ~/storage/downloads/taskholder_notify.py ~/" />
        <CodeBlock code="ls ~/" />
      </div>
    ),
  },
  {
    icon: Play,
    title: 'Run the Script',
    desc: 'In Termux, run the script to start forwarding notifications.',
    detail: (
      <div className="space-y-3">
        <CodeBlock code="python ~/taskholder_notify.py" />
        <p className="text-xs text-slate-500">Keep Termux open. The script sends a heartbeat every 30s — connection status updates automatically on this page.</p>

        <div className="mt-3 rounded-lg border border-red-500/15 bg-red-500/5 p-3 space-y-2">
          <p className="text-xs font-semibold text-red-400">To Stop the Script</p>
          <p className="text-xs text-slate-400">Press <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">Ctrl + C</span> in Termux — this cleanly stops the script.</p>
          <p className="text-xs text-slate-500">If the script is running in background, find and kill it:</p>
          <CodeBlock code="pkill -f taskholder_notify.py" />
          <p className="text-xs text-slate-500">Or check running processes and stop manually:</p>
          <CodeBlock code="ps aux | grep taskholder" />
        </div>
      </div>
    ),
  },
]

function CodeBlock({ code }) {
  const copy = () => {
    navigator.clipboard.writeText(code)
    toast.success('Copied!')
  }
  return (
    <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2 border border-white/10 group">
      <code className="flex-1 text-xs text-green-400 font-mono break-all">{code}</code>
      <button
        onClick={copy}
        className="shrink-0 p-1 text-slate-500 hover:text-white transition-colors"
      >
        <Copy size={13} />
      </button>
    </div>
  )
}

function StepCard({ step, index, expanded, onToggle }) {
  const Icon = step.icon
  return (
    <motion.div
      layout
      className="rounded-xl border border-white/8 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #7c3aed33, #06b6d433)', border: '1px solid rgba(124,58,237,0.3)' }}
        >
          <Icon size={15} className="text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">STEP {index + 1}</span>
          </div>
          <p className="text-sm font-medium text-white">{step.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
        </div>
        <div className="shrink-0 text-slate-500">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-white/5">
              {step.detail}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function NotificationCard({ notif, onDelete, onRead }) {
  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60) return `${Math.floor(diff)}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`rounded-xl border p-4 transition-colors ${
        notif.is_read
          ? 'border-white/5 bg-white/[0.02]'
          : 'border-primary-500/20 bg-primary-500/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-cyan-400 truncate">{notif.app_name}</span>
            <span className="text-xs text-slate-600 shrink-0">{timeAgo(notif.received_at)}</span>
            {!notif.is_read && (
              <div className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
            )}
          </div>
          {notif.title && (
            <p className="text-sm font-medium text-white truncate">{notif.title}</p>
          )}
          {notif.text && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.text}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!notif.is_read && (
            <button
              onClick={() => onRead(notif.id)}
              className="p-1.5 text-slate-500 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-all"
              title="Mark as read"
            >
              <CheckCheck size={14} />
            </button>
          )}
          <button
            onClick={() => onDelete(notif.id)}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function PhoneNotifications() {
  const [token, setToken] = useState(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [status, setStatus] = useState({ connected: false, last_seen: null })
  const [notifications, setNotifications] = useState([])
  const [notifsLoading, setNotifsLoading] = useState(true)
  const [expandedStep, setExpandedStep] = useState(0)
  const [showToken, setShowToken] = useState(false)
  const [clearing, setClearing] = useState(false)
  const pollRef = useRef(null)

  const fetchToken = useCallback(async () => {
    try {
      const res = await getPhoneToken()
      setToken(res.data.phone_api_token)
    } catch {
      toast.error('Failed to load API token')
    }
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getConnectionStatus()
      setStatus(res.data)
    } catch {}
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications({ limit: 50 })
      setNotifications(res.data)
    } catch {} finally {
      setNotifsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchToken()
    fetchStatus()
    fetchNotifications()

    pollRef.current = setInterval(() => {
      fetchStatus()
      fetchNotifications()
    }, POLL_INTERVAL)

    return () => clearInterval(pollRef.current)
  }, [fetchToken, fetchStatus, fetchNotifications])

  const handleRegenerateToken = async () => {
    if (!confirm('Regenerate token? Your running script will stop working until you download and re-run it.')) return
    setTokenLoading(true)
    try {
      const res = await regenerateToken()
      setToken(res.data.phone_api_token)
      toast.success('Token regenerated')
    } catch {
      toast.error('Failed to regenerate token')
    } finally {
      setTokenLoading(false)
    }
  }

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      toast.success('Token copied!')
    }
  }

  const handleDownload = async () => {
    try {
      const res = await api.get('/phone-notifications/download-script', {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'text/x-python' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'taskholder_notify.py'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      toast.success('Script downloaded!')
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) toast.error('Session expired — please log in again')
      else if (status === 404) toast.error('Backend not updated yet — please wait & retry')
      else if (status === 500) toast.error('Server error — backend may still be restarting')
      else toast.error(`Download failed (${status || 'network error'})`)
    }
  }

  const handleRead = async (id) => {
    try {
      await markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch {
      toast.error('Failed to delete notification')
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Clear all notifications?')) return
    setClearing(true)
    try {
      await clearAllNotifications()
      setNotifications([])
      toast.success('All cleared')
    } catch {
      toast.error('Failed to clear notifications')
    } finally {
      setClearing(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
        >
          <Smartphone size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Phone Notifications</h1>
          <p className="text-sm text-slate-500">Mirror your Android notifications here — privately, no third-party servers</p>
        </div>
      </div>

      {/* Connection Status Card */}
      <div
        className="rounded-xl border p-4 flex items-center gap-3"
        style={{
          background: status.connected ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.03)',
          borderColor: status.connected ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)',
        }}
      >
        {status.connected ? (
          <Wifi size={20} className="text-green-400 shrink-0" />
        ) : (
          <WifiOff size={20} className="text-slate-500 shrink-0" />
        )}
        <div className="flex-1">
          <p className={`text-sm font-medium ${status.connected ? 'text-green-400' : 'text-slate-400'}`}>
            {status.connected ? 'Script Connected' : 'Script Not Running'}
          </p>
          {status.last_seen && (
            <p className="text-xs text-slate-500 mt-0.5">
              Last seen: {new Date(status.last_seen).toLocaleTimeString()}
            </p>
          )}
          {!status.connected && !status.last_seen && (
            <p className="text-xs text-slate-500 mt-0.5">Follow the setup steps below to get started</p>
          )}
        </div>
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${status.connected ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
      </div>

      {/* Setup Steps */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Setup Guide</h2>
        <div className="space-y-2">
          {STEPS.map((step, i) => (
            <StepCard
              key={i}
              step={step}
              index={i}
              expanded={expandedStep === i}
              onToggle={() => setExpandedStep(expandedStep === i ? -1 : i)}
            />
          ))}
        </div>
      </div>

      {/* Download + Token */}
      <div
        className="rounded-xl border border-white/8 p-5 space-y-4"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Your Script</h2>
          <span className="text-xs text-slate-500">Pre-configured with your token</span>
        </div>

        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
        >
          <Download size={16} />
          Download taskholder_notify.py
        </button>

        {/* Termux curl command */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Terminal size={13} className="text-green-400" />
            <span className="text-xs font-semibold text-green-400">Download directly in Termux (Recommended)</span>
          </div>
          <p className="text-xs text-slate-500">Open Termux and paste this command — no browser download needed:</p>
          <CodeBlock
            code={token
              ? `curl -H "X-API-Token: ${token}" https://taskholder-sp.vercel.app/api/phone-notifications/download-script-token -o ~/taskholder_notify.py`
              : 'Loading your command...'}
          />
          <p className="text-xs text-slate-600">This saves the script directly to your Termux home folder.</p>
        </div>

        {/* API Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">API Token</span>
            <button
              onClick={() => setShowToken((v) => !v)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showToken ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2 border border-white/8">
            <code className="flex-1 text-xs text-slate-400 font-mono truncate">
              {showToken ? token : token ? '•'.repeat(20) : '—'}
            </code>
            <button
              onClick={handleCopyToken}
              className="shrink-0 p-1 text-slate-500 hover:text-white transition-colors"
              title="Copy token"
            >
              <Copy size={13} />
            </button>
            <button
              onClick={handleRegenerateToken}
              disabled={tokenLoading}
              className="shrink-0 p-1 text-slate-500 hover:text-amber-400 transition-colors disabled:opacity-50"
              title="Regenerate token"
            >
              <RefreshCw size={13} className={tokenLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="text-xs text-slate-600">The script embeds this token automatically. Regenerating invalidates the old script.</p>
        </div>
      </div>

      {/* Notifications Panel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-400 font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />
              Clear all
            </button>
          )}
        </div>

        {notifsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/5 p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 shimmer rounded w-20" />
                      <div className="h-3 shimmer rounded w-12" />
                    </div>
                    <div className="h-4 shimmer rounded w-3/4" />
                    <div className="h-3 shimmer rounded w-1/2" />
                  </div>
                  <div className="w-7 h-7 shimmer rounded-lg shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="rounded-xl border border-white/5 flex flex-col items-center justify-center py-12 gap-3"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <BellOff size={28} className="text-slate-700" />
            <p className="text-sm text-slate-600">No notifications yet</p>
            <p className="text-xs text-slate-700">Start the script on your phone to begin mirroring</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {notifications.map((n) => (
                <NotificationCard
                  key={n.id}
                  notif={n}
                  onDelete={handleDelete}
                  onRead={handleRead}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}
