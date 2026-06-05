import api from './axios'

export const getPhoneToken = () => api.get('/phone-notifications/token')
export const regenerateToken = () => api.post('/phone-notifications/token/regenerate')
export const getConnectionStatus = () => api.get('/phone-notifications/status')
export const getNotifications = (params) => api.get('/phone-notifications', { params })
export const markRead = (id) => api.patch(`/phone-notifications/${id}/read`)
export const deleteNotification = (id) => api.delete(`/phone-notifications/${id}`)
export const clearAllNotifications = () => api.delete('/phone-notifications')
export const getDownloadScriptUrl = () => `${api.defaults.baseURL}/phone-notifications/download-script`
