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

// ---- Global in-flight tracker (drives the cold-start "waking server" indicator) ----
// Counts every API request across the app — including login, which doesn't go
// through React Query — so the indicator can appear whenever the API is slow.
let inflight = 0
const inflightListeners = new Set<(n: number) => void>()
function setInflight(n: number) {
  inflight = n
  inflightListeners.forEach((fn) => fn(inflight))
}
export function getInflight(): number {
  return inflight
}
export function subscribeInflight(fn: (n: number) => void): () => void {
  inflightListeners.add(fn)
  return () => inflightListeners.delete(fn)
}

api.interceptors.request.use(
  (config) => {
    setInflight(inflight + 1)
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => {
    setInflight(Math.max(0, inflight - 1))
    return Promise.reject(error)
  },
)

// On 401, drop the token and bounce to login.
api.interceptors.response.use(
  (r) => {
    setInflight(Math.max(0, inflight - 1))
    return r
  },
  (error) => {
    setInflight(Math.max(0, inflight - 1))
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
