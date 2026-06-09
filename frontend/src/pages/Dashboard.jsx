import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckSquare, TrendingUp, ListTodo, FileText, Filter } from 'lucide-react'
import { getTaskStats, getTasks } from '../api/tasks'
import { getNotes } from '../api/notes'
import { useAuth } from '../context/AuthContext'
import { StatSkeleton, RowSkeleton } from '../components/common/SkeletonCard'
import Header from '../components/layout/Header'

const gradients = [
  'linear-gradient(135deg, #7c3aed, #a855f7)',
  'linear-gradient(135deg, #2563eb, #06b6d4)',
  'linear-gradient(135deg, #059669, #10b981)',
  'linear-gradient(135deg, #d97706, #f59e0b)',
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const StatCard = ({ icon: Icon, label, value, gradient, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="rounded-xl p-5 border border-white/8 relative overflow-hidden"
    style={{ background: '#12121e' }}
  >
    <div className="absolute inset-0 opacity-5" style={{ background: gradient }} />
    <div className="relative flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: gradient }}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-slate-500 text-sm">{label}</p>
      </div>
    </div>
  </motion.div>
)

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

const statusColors = {
  todo: 'bg-slate-700 text-slate-300',
  in_progress: 'bg-blue-500/20 text-blue-400',
  done: 'bg-green-500/20 text-green-400',
}
const statusLabels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
const dotColors = { todo: '#64748b', in_progress: '#60a5fa', done: '#4ade80' }
const priorityConfig = {
  low: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  high: 'bg-red-500/15 text-red-400 border border-red-500/20',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, done: 0, in_progress: 0, todo: 0 })
  const [noteCount, setNoteCount] = useState(0)
  const [allTasks, setAllTasks] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getTaskStats().then(r => setStats(r.data)),
      getNotes().then(r => setNoteCount(r.data.length)),
      getTasks().then(r => setAllTasks(r.data)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const recentTasks = (statusFilter
    ? allTasks.filter(t => t.status === statusFilter)
    : allTasks
  ).slice(0, 5)

  return (
    <div>
      <Header
        title={`${getGreeting()}, ${user?.username}! 👋`}
        subtitle="Here's what's happening with your tasks"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={ListTodo} label="Total Tasks" value={stats.total} gradient={gradients[0]} delay={0.1} />
            <StatCard icon={TrendingUp} label="In Progress" value={stats.in_progress} gradient={gradients[1]} delay={0.15} />
            <StatCard icon={CheckSquare} label="Completed" value={stats.done} gradient={gradients[2]} delay={0.2} />
            <StatCard icon={FileText} label="Notes" value={noteCount} gradient={gradients[3]} delay={0.25} />
          </>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: loading ? 0 : 0.3 }}
        className="rounded-xl border border-white/8 p-4 md:p-6"
        style={{ background: '#12121e' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Tasks</h2>
          <div
            className="flex items-center gap-0.5 rounded-lg border border-white/10 p-1 overflow-x-auto"
            style={{ background: '#0a0a14' }}
          >
            <Filter size={13} className="text-slate-600 ml-1.5 shrink-0" />
            {STATUS_FILTERS.map(s => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  statusFilter === s.value ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
          </div>
        ) : recentTasks.length === 0 ? (
          <p className="text-slate-600 text-sm text-center py-6">No tasks found.</p>
        ) : (
          <div className="space-y-1">
            {recentTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: dotColors[task.status] }}
                  />
                  <span
                    className={`text-sm font-medium truncate ${
                      task.status === 'done' ? 'line-through text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <span className={`badge ${statusColors[task.status]}`}>
                    {statusLabels[task.status]}
                  </span>
                  {task.priority && (
                    <span className={`badge ${priorityConfig[task.priority]}`}>
                      {task.priority}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
