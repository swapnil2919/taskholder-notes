import api from './axios'

export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const getMe = () => api.get('/auth/me')
export const validateDb = (db_url) => api.post('/auth/validate-db', { db_url })
export const getDbStatus = () => api.get('/auth/db-status')
