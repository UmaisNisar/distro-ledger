import axios from 'axios'

const TOKEN_KEY = 'dl_token'

// In prod, set VITE_API_URL to the deployed API origin. In dev, '' uses the Vite proxy.
const baseURL = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({ baseURL })

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable (private mode) — token stays in memory only */
  }
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, drop the token and bounce to login.
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401 && getToken()) {
      setToken(null)
      if (!location.pathname.startsWith('/login')) location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; title?: string } | undefined
    return data?.message ?? data?.title ?? error.message ?? fallback
  }
  return fallback
}
