import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckSquare, Clock, ListTodo, FileText, TrendingUp } from 'lucide-react'
import { getTaskStats } from '../api/tasks'
import { getNotes } from '../api/notes'
import { getTasks } from '../api/tasks'
import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="card flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-slate-500 text-sm">{label}</p>
    </div>
  </motion.div>
)

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

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

  const statusColors = { todo: 'bg-slate-100 text-slate-600', in_progress: 'bg-blue-100 text-blue-700', done: 'bg-green-100 text-green-700' }
  const statusLabels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }

  return (
    <div>
      <Header
        title={`${getGreeting()}, ${user?.username}! 👋`}
        subtitle="Here's what's happening with your tasks"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ListTodo} label="Total Tasks" value={stats.total} color="bg-primary-500" delay={0.1} />
        <StatCard icon={TrendingUp} label="In Progress" value={stats.in_progress} color="bg-blue-500" delay={0.15} />
        <StatCard icon={CheckSquare} label="Completed" value={stats.done} color="bg-green-500" delay={0.2} />
        <StatCard icon={FileText} label="Notes" value={noteCount} color="bg-purple-500" delay={0.25} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Tasks</h2>
        {recentTasks.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No tasks yet. Create your first task!</p>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-green-400' : task.status === 'in_progress' ? 'bg-blue-400' : 'bg-slate-300'}`} />
                  <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {task.title}
                  </span>
                </div>
                <span className={`badge ${statusColors[task.status]}`}>{statusLabels[task.status]}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
