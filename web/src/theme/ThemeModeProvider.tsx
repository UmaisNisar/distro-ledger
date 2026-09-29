import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { applyMode, getMode, type Mode } from './theme'

interface ThemeModeState {
  mode: Mode
  toggle: () => void
  setMode: (m: Mode) => void
}

const ThemeModeContext = createContext<ThemeModeState | undefined>(undefined)

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => getMode())

  const setMode = useCallback((m: Mode) => {
    applyMode(m)
    setModeState(m)
  }, [])

  const toggle = useCallback(() => setMode(mode === 'dark' ? 'light' : 'dark'), [mode, setMode])

  const value = useMemo(() => ({ mode, toggle, setMode }), [mode, toggle, setMode])
  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeMode(): ThemeModeState {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider')
  return ctx
}
