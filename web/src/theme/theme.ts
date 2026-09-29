/** Applies the tenant accent color to CSS variables and picks a readable contrast. */
export function applyAccent(hex: string) {
  const root = document.documentElement
  root.style.setProperty('--accent', hex)
  root.style.setProperty('--accent-contrast', contrastColor(hex))
}

/** Returns black or white depending on which reads better on the given color. */
export function contrastColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  // relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#000000' : '#ffffff'
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const int = parseInt(h.slice(0, 6), 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

/** A curated set of iOS-style accent colors for the onboarding picker. */
export const ACCENT_PRESETS = [
  '#0A84FF', // blue
  '#30D158', // green
  '#FF9F0A', // orange
  '#FF375F', // pink
  '#BF5AF2', // purple
  '#FF453A', // red
  '#64D2FF', // teal
  '#5E5CE6', // indigo
]
