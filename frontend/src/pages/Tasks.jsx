import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus, Filter, Search, X } from 'lucide-react'
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks'
import TaskCard from '../components/tasks/TaskCard'
import TaskModal from '../components/tasks/TaskModal'
import TaskViewPage from '../components/tasks/TaskViewPage'
import TextEditorPage from '../components/common/TextEditorPage'
import { TaskSkeleton } from '../components/common/SkeletonCard'
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
  const [pageLoading, setPageLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [viewingTask, setViewingTask] = useState(null)
  const [textEditingTask, setTextEditingTask] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const firstLoad = useRef(true)

  const fetchTasks = useCallback(async () => {
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (priorityFilter) params.priority = priorityFilter
      const { data } = await getTasks(params)
      setTasks(data)
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      if (firstLoad.current) {
        firstLoad.current = false
        setPageLoading(false)
      }
    }
  }, [statusFilter, priorityFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks
    const q = searchQuery.toLowerCase()
    return tasks.filter(t => t.title.toLowerCase().includes(q))
  }, [tasks, searchQuery])

  const handleSubmit = async (data) => {
    setLoading(true)
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data)
        toast.success('Task updated!')
        if (viewingTask?.id === editingTask.id) {
          setViewingTask(prev => ({ ...prev, ...data }))
        }
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

  const handleTextSave = async ({ title, text }) => {
    setLoading(true)
    try {
      await updateTask(textEditingTask.id, { title, description: text })
      toast.success('Task updated!')
      fetchTasks()
      setViewingTask(prev => prev ? { ...prev, title, description: text } : prev)
      setTextEditingTask(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header
        title="Tasks"
        subtitle={`${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`}
        action={
          <button
            onClick={() => { setEditingTask(null); setModalOpen(true) }}
            className="btn-primary"
          >
            <Plus size={18} /> New Task
          </button>
        }
      />

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tasks by title..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 transition-colors"
          style={{ background: '#12121e' }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter bars */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div
          className="flex items-center gap-0.5 rounded-lg border border-white/10 p-1 overflow-x-auto max-w-full"
          style={{ background: '#12121e' }}
        >
          <Filter size={14} className="text-slate-600 ml-2 shrink-0" />
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === s.value ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div
          className="flex items-center gap-0.5 rounded-lg border border-white/10 p-1 overflow-x-auto max-w-full"
          style={{ background: '#12121e' }}
        >
          {PRIORITIES.map(p => (
            <button
              key={p.value}
              onClick={() => setPriorityFilter(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                priorityFilter === p.value ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {pageLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <TaskSkeleton key={i} />)}
        </div>
      ) : filteredTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-slate-600 text-lg">No tasks found</p>
          <p className="text-slate-700 text-sm mt-1">
            {searchQuery ? 'Try a different search term' : 'Create your first task to get started'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onView={setViewingTask}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
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

      <AnimatePresence>
        {viewingTask && !textEditingTask && (
          <TaskViewPage
            task={viewingTask}
            onClose={() => setViewingTask(null)}
            onEditConfig={handleEdit}
            onEditText={task => setTextEditingTask(task)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {textEditingTask && (
          <TextEditorPage
            item={textEditingTask}
            onClose={() => setTextEditingTask(null)}
            onSave={handleTextSave}
            loading={loading}
            textLabel="description"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
