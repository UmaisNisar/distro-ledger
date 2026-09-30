import { format, parseISO } from 'date-fns'
import { money, moneyCompact } from '../lib/format'
import type { Sale } from '../lib/types'
import { PaymentBadge } from './ui'

function dateParts(iso: string): { day: string; mon: string } {
  try {
    const d = parseISO(iso)
    return { day: format(d, 'd'), mon: format(d, 'MMM') }
  } catch {
    return { day: '–', mon: '' }
  }
}

/**
 * Mobile-friendly sale row: a card with a date chip, customer + invoice, and a
 * right-aligned amount + status pill. Replaces wide tables on small screens.
 */
export function SaleRowCard({
  sale,
  symbol,
  onClick,
}: {
  sale: Sale
  symbol: string
  onClick?: () => void
}) {
  const { day, mon } = dateParts(sale.date)
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-base-200 last:border-0 hover:bg-base-200 transition-colors"
    >
      <span className="flex flex-col items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-base-200">
        <span className="tabular text-[0.95rem] leading-none font-semibold">{day}</span>
        <span className="text-[0.62rem] uppercase text-secondary tracking-wide">{mon}</span>
      </span>
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-[0.95rem] font-medium truncate" title={sale.customerName}>{sale.customerName}</span>
        <span className="footnote text-secondary truncate tabular">{sale.invoiceNumber}</span>
      </span>
      <span className="flex flex-col items-end gap-1 shrink-0">
        <span className="tabular text-[0.95rem] font-semibold" title={money(sale.amount, symbol)}>{moneyCompact(sale.amount, symbol)}</span>
        <PaymentBadge status={sale.paymentStatus} />
      </span>
    </button>
  )
}
