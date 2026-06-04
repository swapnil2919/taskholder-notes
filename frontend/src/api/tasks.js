import api from './axios'

export const getTasks = (params) => api.get('/tasks', { params })
export const getTaskStats = () => api.get('/tasks/stats')
export const createTask = (data) => api.post('/tasks', data)
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`)
