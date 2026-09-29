import { format, parseISO } from 'date-fns'

/** Formats a whole-number amount with the tenant's currency symbol and grouped
 * thousands. No decimals — PKR (and similar) are dealt with in whole units. */
export function money(amount: number, symbol = 'Rs'): string {
  const n = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
    Math.round(amount ?? 0),
  )
  return `${symbol} ${n}`
}

/** Grouped whole number without a currency symbol. */
export function num(amount: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(amount ?? 0))
}

/** Compact money for KPI tiles (e.g. Rs 1.4M). */
export function moneyCompact(amount: number, symbol = 'Rs'): string {
  const abs = Math.abs(amount ?? 0)
  if (abs >= 1_000_000) return `${symbol} ${(amount / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${symbol} ${(amount / 1_000).toFixed(1)}K`
  return money(amount, symbol)
}

/** Short number for chart labels (e.g. 150K, 2.82M). */
export function shortNum(amount: number): string {
  const n = amount ?? 0
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  if (abs >= 1_000) return Math.round(n / 1_000) + 'K'
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
