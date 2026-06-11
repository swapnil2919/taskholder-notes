import api from './axios'

export const listDbConfigs = () => api.get('/db-configs')
export const addDbConfig = (name, url) => api.post('/db-configs', { name, url })
export const deleteDbConfig = (id) => api.delete(`/db-configs/${id}`)
export const activateDbConfig = (id) => api.post(`/db-configs/${id}/activate`)
