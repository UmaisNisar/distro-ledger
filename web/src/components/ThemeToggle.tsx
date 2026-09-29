import { Moon, Sun } from 'lucide-react'
import { useThemeMode } from '../theme/ThemeModeProvider'

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { mode, toggle } = useThemeMode()
  const isDark = mode === 'dark'

  if (compact) {
    return (
      <button className="btn btn-ghost btn-sm btn-circle" onClick={toggle} aria-label="Toggle theme">
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    )
  }

  return (
    <button
      className="btn btn-ghost btn-sm justify-start gap-2 w-full"
      onClick={toggle}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}
