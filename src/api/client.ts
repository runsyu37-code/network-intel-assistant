import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 10_000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    if (error.response?.status === 403) {
      error.isForbidden = true
    }
    return Promise.reject(error)
  },
)

export default client
