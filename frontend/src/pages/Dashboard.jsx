import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckSquare, TrendingUp, ListTodo, FileText, ArrowUp } from 'lucide-react'
import { getTaskStats } from '../api/tasks'
import { getNotes } from '../api/notes'
import { getTasks } from '../api/tasks'
import { useAuth } from '../context/AuthContext'
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

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, done: 0, in_progress: 0, todo: 0 })
  const [noteCount, setNoteCount] = useState(0)
  const [recentTasks, setRecentTasks] = useState([])

  useEffect(() => {
    getTaskStats().then(r => setStats(r.data)).catch(() => {})
    getNotes().then(r => setNoteCount(r.data.length)).catch(() => {})
    getTasks().then(r => setRecentTasks(r.data.slice(0, 5))).catch(() => {})
  }, [])

  const statusColors = {
    todo: 'bg-slate-700 text-slate-300',
    in_progress: 'bg-blue-500/20 text-blue-400',
    done: 'bg-green-500/20 text-green-400'
  }
  const statusLabels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
  const dotColors = { todo: '#64748b', in_progress: '#60a5fa', done: '#4ade80' }

  return (
    <div>
      <Header
        title={`${getGreeting()}, ${user?.username}! 👋`}
        subtitle="Here's what's happening with your tasks"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ListTodo} label="Total Tasks" value={stats.total} gradient={gradients[0]} delay={0.1} />
        <StatCard icon={TrendingUp} label="In Progress" value={stats.in_progress} gradient={gradients[1]} delay={0.15} />
        <StatCard icon={CheckSquare} label="Completed" value={stats.done} gradient={gradients[2]} delay={0.2} />
        <StatCard icon={FileText} label="Notes" value={noteCount} gradient={gradients[3]} delay={0.25} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-white/8 p-6"
        style={{ background: '#12121e' }}
      >
        <h2 className="text-lg font-semibold text-white mb-4">Recent Tasks</h2>
        {recentTasks.length === 0 ? (
          <p className="text-slate-600 text-sm text-center py-6">No tasks yet. Create your first task!</p>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColors[task.status] }} />
                  <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                    {task.title}
                  </span>
                </div>
                <span className={`badge ${statusColors[task.status]}`}>{statusLabels[task.status]}</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
