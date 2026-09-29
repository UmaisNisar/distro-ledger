import axios from 'axios'

const ADMIN_TOKEN_KEY = 'dl_admin_token'
const baseURL = import.meta.env.VITE_API_URL ?? ''

export const adminApi = axios.create({ baseURL })

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAdminToken(token: string | null) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
    else localStorage.removeItem(ADMIN_TOKEN_KEY)
  } catch {
    /* storage unavailable */
  }
}

adminApi.interceptors.request.use((config) => {
  const token = getAdminToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

adminApi.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401 && getAdminToken()) {
      setAdminToken(null)
      if (!location.pathname.startsWith('/admin/login')) location.href = '/admin/login'
    }
    return Promise.reject(error)
  },
)
