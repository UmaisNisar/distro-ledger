// ---- Accent (per-tenant) ----
/** Bridges the tenant accent color into DaisyUI's primary color token. */
export function applyAccent(hex: string) {
  const root = document.documentElement
  root.style.setProperty('--color-primary', hex)
  root.style.setProperty('--color-primary-content', contrastColor(hex))
}

export function contrastColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.62 ? '#111111' : '#ffffff'
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const int = parseInt(h.slice(0, 6), 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

// ---- Light / dark mode ----
export type Mode = 'light' | 'dark'
const MODE_KEY = 'dl_theme'

export function getMode(): Mode {
  try {
    const saved = localStorage.getItem(MODE_KEY) as Mode | null
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* ignore */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyMode(mode: Mode) {
  document.documentElement.setAttribute('data-theme', mode)
  try {
    localStorage.setItem(MODE_KEY, mode)
  } catch {
    /* ignore */
  }
}

/** Call once before React renders so there's no flash of the wrong theme. */
export function initTheme() {
  applyMode(getMode())
  applyAccent(DEFAULT_ACCENT) // consistent branding before a tenant loads
}

export const DEFAULT_ACCENT = '#17613F'

export const ACCENT_PRESETS = [
  '#17613F', // forest (default)
  '#0F766E', // teal
  '#1D4ED8', // blue
  '#7C3AED', // violet
  '#B45309', // amber
  '#BE123C', // rose
  '#0369A1', // ocean
  '#4D7C0F', // olive
]
