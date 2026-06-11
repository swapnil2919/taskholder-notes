import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginApi, register as registerApi } from '../api/auth'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const login = async (credentials) => {
    setLoading(true)
    try {
      const { data } = await loginApi(credentials)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.username}!`)
      navigate('/dashboard')
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail
      let message
      if (typeof detail === 'string' && detail.trim()) {
        const lower = detail.toLowerCase()
        if (lower.includes('not found') || lower.includes('no user') || lower.includes('does not exist')) {
          message = 'No account found with this email. Please register first.'
        } else if (lower.includes('incorrect') || lower.includes('wrong') || lower.includes('invalid') || lower.includes('password')) {
          message = 'You entered the wrong password. Please try again.'
        } else {
          message = detail
        }
      } else if (status === 404) {
        message = 'No account found with this email. Please register first.'
      } else if (status === 401) {
        message = 'You entered the wrong password. Please try again.'
      } else {
        message = 'Login failed. Please check your credentials.'
      }
      toast.error(message, { duration: 4000 })
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    setLoading(true)
    try {
      // strip confirmPassword before sending to API
      const { confirmPassword, ...payload } = userData
      await registerApi(payload)
      toast.success('Account created! Please log in.')
      navigate('/login')
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail
      let message
      if (typeof detail === 'string' && detail.trim()) {
        const lower = detail.toLowerCase()
        if (lower.includes('already') || lower.includes('exist') || lower.includes('registered') || lower.includes('duplicate')) {
          message = 'This email is already registered. Please login instead.'
        } else {
          message = detail
        }
      } else if (status === 400 || status === 409 || status === 422) {
        message = 'This email is already registered. Please login instead.'
      } else {
        message = 'Registration failed. Please try again.'
      }
      toast.error(message, { duration: 4000 })
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
