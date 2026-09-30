import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, setToken } from '../lib/api'
import type { AuthResponse, Company } from '../lib/types'
import { applyAccent } from '../theme/theme'
import { setNumberingSystem } from '../lib/format'

interface AuthState {
  company: Company | null
  ready: boolean
  onboard: (payload: unknown) => Promise<void>
  login: (slug: string, password: string) => Promise<void>
  logout: () => void
  setCompany: (c: Company) => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [company, setCompanyState] = useState<Company | null>(null)
  const [ready, setReady] = useState(false)

  const setCompany = useCallback((c: Company) => {
    setCompanyState(c)
    applyAccent(c.themeColor)
    setNumberingSystem(c.currencyCode)
  }, [])

  // On boot, if we have a token, hydrate the company.
  useEffect(() => {
    let active = true
    async function boot() {
      try {
        const { data } = await api.get<Company>('/api/settings')
        if (active) setCompany(data)
      } catch {
        /* not logged in */
      } finally {
        if (active) setReady(true)
      }
    }
    boot()
    return () => {
      active = false
    }
  }, [setCompany])

  const onboard = useCallback(
    async (payload: unknown) => {
      const { data } = await api.post<AuthResponse>('/api/onboarding', payload)
      setToken(data.token)
      setCompany(data.company)
    },
    [setCompany],
  )

  const login = useCallback(
    async (slug: string, password: string) => {
      const { data } = await api.post<AuthResponse>('/api/auth/login', { slug, password })
      setToken(data.token)
      setCompany(data.company)
    },
    [setCompany],
  )

  const logout = useCallback(() => {
    setToken(null)
    setCompanyState(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ company, ready, onboard, login, logout, setCompany }),
    [company, ready, onboard, login, logout, setCompany],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
