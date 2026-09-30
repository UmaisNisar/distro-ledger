import { format, parseISO } from 'date-fns'

// ---- Numbering system ----------------------------------------------------
// The app is multi-tenant with a configurable currency, so large numbers are
// abbreviated to match how that currency's users read them:
//  - South Asian (PKR/INR/…): lakh/crore + 2,2,3 digit grouping (1,11,37,355)
//  - Everyone else: thousand/million (K/M) + Western grouping (11,137,355)
// setNumberingSystem() is called once from the tenant's currency on load.
type NumberingSystem = 'south-asian' | 'western'
const SOUTH_ASIAN = new Set(['PKR', 'INR', 'LKR', 'NPR', 'BDT', 'MMK'])
let numberingSystem: NumberingSystem = 'western'

export function setNumberingSystem(currencyCode?: string | null) {
  numberingSystem = currencyCode && SOUTH_ASIAN.has(currencyCode.toUpperCase()) ? 'south-asian' : 'western'
}

const groupLocale = () => (numberingSystem === 'south-asian' ? 'en-IN' : 'en-US')
const trim = (s: string) => s.replace(/\.?0+$/, '')

/** Formats a whole-number amount with the tenant's currency symbol and locale
 * grouping. No decimals — PKR (and similar) are dealt with in whole units. */
export function money(amount: number, symbol = 'Rs'): string {
  const n = new Intl.NumberFormat(groupLocale(), { maximumFractionDigits: 0 }).format(Math.round(amount ?? 0))
  return `${symbol} ${n}`
}

/** Grouped whole number without a currency symbol. */
export function num(amount: number): string {
  return new Intl.NumberFormat(groupLocale(), { maximumFractionDigits: 0 }).format(Math.round(amount ?? 0))
}

/** Readable amount WITHOUT a currency symbol. Abbreviates only large values —
 * Cr/Lac (South Asian) or M (Western) — and leaves anything under the threshold
 * as a full grouped number (small amounts are already easy to read). */
export function compactAmount(amount: number): string {
  const n = amount ?? 0
  const abs = Math.abs(n)
  if (numberingSystem === 'south-asian') {
    if (abs >= 1e7) return trim((n / 1e7).toFixed(2)) + ' Cr'
    if (abs >= 1e5) return trim((n / 1e5).toFixed(2)) + ' Lac'
    return num(n)
  }
  if (abs >= 1e6) return trim((n / 1e6).toFixed(2)) + 'M'
  return num(n)
}

/** Readable money with the tenant's symbol (e.g. Rs 1.11 Cr, Rs 1.13 Lac, Rs 22,440). */
export function moneyCompact(amount: number, symbol = 'Rs'): string {
  return `${symbol} ${compactAmount(amount)}`
}

/** Short number for chart labels (e.g. 1.5Lac, 1.11Cr / 150K, 2.82M). */
export function shortNum(amount: number): string {
  const n = amount ?? 0
  const abs = Math.abs(n)
  if (numberingSystem === 'south-asian') {
    if (abs >= 1e7) return trim((n / 1e7).toFixed(2)) + 'Cr'
    if (abs >= 1e5) return trim((n / 1e5).toFixed(1)) + 'Lac'
    if (abs >= 1e3) return Math.round(n / 1e3) + 'K'
    return String(Math.round(n))
  }
  if (abs >= 1e6) return trim((n / 1e6).toFixed(2)) + 'M'
  if (abs >= 1e3) return Math.round(n / 1e3) + 'K'
  return String(Math.round(n))
}

export function shortDate(iso: string): string {
  try {
    return format(parseISO(iso), 'd MMM yyyy')
  } catch {
    return iso
  }
}

/** Day + short month, no year (e.g. "24 Sep") — for tight tiles. */
export function dayMonth(iso: string): string {
  try {
    return format(parseISO(iso), 'd MMM')
  } catch {
    return iso
  }
}

export function inputDate(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy-MM-dd')
  } catch {
    return iso
  }
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
