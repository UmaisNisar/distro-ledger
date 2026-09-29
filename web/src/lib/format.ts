import { format, parseISO } from 'date-fns'

/** Formats an amount with the tenant's currency symbol and grouped thousands. */
export function money(amount: number, symbol = 'Rs'): string {
  const n = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0)
  return `${symbol} ${n}`
}

/** Compact money for KPI tiles (e.g. Rs 1.4M). */
export function moneyCompact(amount: number, symbol = 'Rs'): string {
  const abs = Math.abs(amount ?? 0)
  if (abs >= 1_000_000) return `${symbol} ${(amount / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${symbol} ${(amount / 1_000).toFixed(1)}K`
  return money(amount, symbol)
}

export function shortDate(iso: string): string {
  try {
    return format(parseISO(iso), 'd MMM yyyy')
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
