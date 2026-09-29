import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { adminApi, getAdminToken, setAdminToken } from '../lib/adminApi'
import type { AdminAuth } from '../lib/types'

interface AdminState {
  authed: boolean
  ready: boolean
  username: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AdminContext = createContext<AdminState | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    async function boot() {
      if (!getAdminToken()) {
        if (active) setReady(true)
        return
      }
      try {
        const { data } = await adminApi.get<{ username: string }>('/api/admin/me')
        if (active) {
          setAuthed(true)
          setUsername(data.username)
        }
      } catch {
        setAdminToken(null)
      } finally {
        if (active) setReady(true)
      }
    }
    boot()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (u: string, p: string) => {
    const { data } = await adminApi.post<AdminAuth>('/api/admin/login', { username: u, password: p })
    setAdminToken(data.token)
    setAuthed(true)
    setUsername(data.username)
  }, [])

  const logout = useCallback(() => {
    setAdminToken(null)
    setAuthed(false)
    setUsername(null)
  }, [])

  const value = useMemo<AdminState>(
    () => ({ authed, ready, username, login, logout }),
    [authed, ready, username, login, logout],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdmin(): AdminState {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
