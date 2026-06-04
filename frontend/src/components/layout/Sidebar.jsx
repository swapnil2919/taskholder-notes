import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, CheckSquare, FileText, LogOut, Zap, Mail } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/notes', icon: FileText, label: 'Notes' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <motion.aside
      initial={{ x: -240 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-full w-60 flex flex-col z-10"
      style={{ background: 'rgba(10,10,20,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">TaskHolder</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-primary-400' : ''} />
                {label}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-2 mt-2 border-t border-white/5">
          <a
            href="https://ai-email-sender.streamlit.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all duration-200"
          >
            <Mail size={18} />
            Send Email
          </a>
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
            <span className="text-white font-semibold text-sm">
              {user?.username?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <p className="text-xs text-slate-600 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </motion.aside>
  )
}
