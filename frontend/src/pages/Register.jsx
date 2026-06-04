import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Zap, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

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
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 60%)' }} />
    </div>
  )
}

export default function Register() {
  const { register: registerUser, loading } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm()

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0a14' }}>
      <StarField />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 animate-float"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}
          >
            <Zap size={30} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">Create account</h1>
          <p className="text-slate-500 mt-1 text-sm">Get started with TaskHolder today</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8"
          style={{ boxShadow: '0 0 40px rgba(139,92,246,0.1)' }}
        >
          <form onSubmit={handleSubmit(registerUser)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  {...register('username', { required: 'Username is required', minLength: { value: 3, message: 'Min 3 characters' } })}
                  className="input-field pl-9"
                  placeholder="johndoe"
                />
              </div>
              {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
            </div>

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

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                  type="password"
                  className="input-field pl-9"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 mt-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
