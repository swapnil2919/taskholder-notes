import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus, Filter } from 'lucide-react'
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks'
import TaskCard from '../components/tasks/TaskCard'
import TaskModal from '../components/tasks/TaskModal'
import Header from '../components/layout/Header'

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

const PRIORITIES = [
  { value: '', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const fetchTasks = useCallback(async () => {
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (priorityFilter) params.priority = priorityFilter
      const { data } = await getTasks(params)
      setTasks(data)
    } catch {
      toast.error('Failed to load tasks')
    }
  }, [statusFilter, priorityFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleSubmit = async (data) => {
    setLoading(true)
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data)
        toast.success('Task updated!')
      } else {
        await createTask(data)
        toast.success('Task created!')
      }
      fetchTasks()
      setModalOpen(false)
      setEditingTask(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    try {
      await deleteTask(id)
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setModalOpen(true)
  }

  return (
    <div>
      <Header
        title="Tasks"
        subtitle={`${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => { setEditingTask(null); setModalOpen(true) }} className="btn-primary">
            <Plus size={18} /> New Task
          </button>
        }
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1" style={{ background: '#12121e' }}>
          <Filter size={14} className="text-slate-600 ml-2" />
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === s.value ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1" style={{ background: '#12121e' }}>
          {PRIORITIES.map(p => (
            <button
              key={p.value}
              onClick={() => setPriorityFilter(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${priorityFilter === p.value ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-600 text-lg">No tasks found</p>
          <p className="text-slate-700 text-sm mt-1">Create your first task to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null) }}
        onSubmit={handleSubmit}
        task={editingTask}
        loading={loading}
      />
    </div>
  )
}
