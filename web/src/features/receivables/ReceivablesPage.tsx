import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Page } from '../../components/Page'
import { EmptyState, SectionHeader, SkeletonRows, StatTile } from '../../components/ui'
import { money, shortDate } from '../../lib/format'
import { useReceivables } from '../../lib/queries'

export function ReceivablesPage() {
  const { company } = useAuth()
  const symbol = company?.currencySymbol ?? 'Rs'
  const { data, isLoading } = useReceivables()

  return (
    <Page title="Receivables">
      {isLoading || !data ? (
        <SkeletonRows count={6} />
      ) : data.customers.length === 0 ? (
        <div className="card">
          <EmptyState title="All settled" subtitle="No outstanding balances right now." />
        </div>
      ) : (
        <>
          <StatTile label="Total outstanding" value={money(data.totalOutstanding, symbol)} accent />

          <SectionHeader>By customer</SectionHeader>
          <div className="inset-group">
            {data.customers.map((c) => (
              <Link key={c.customerId} to={`/customers/${c.customerId}`} className="list-row list-row-tap block">
                <div className="min-w-0 flex-1">
                  <div className="subhead truncate" style={{ fontWeight: 600 }}>{c.customerName}</div>
                  <div className="footnote text-secondary truncate">
                    {c.openInvoices} open · oldest {c.oldestDate ? shortDate(c.oldestDate) : '—'}
                  </div>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <AgeChip label="≤30d" value={c.current} symbol={symbol} tone="ok" />
                    <AgeChip label="31–60" value={c.days31To60} symbol={symbol} tone="warn" />
                    <AgeChip label="61–90" value={c.days61To90} symbol={symbol} tone="warn" />
                    <AgeChip label="90+" value={c.days90Plus} symbol={symbol} tone="bad" />
                  </div>
                </div>
                <div className="ml-3 text-right shrink-0">
                  <div className="subhead" style={{ fontWeight: 700 }}>{money(c.outstanding, symbol)}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </Page>
  )
}

function AgeChip({
  label,
  value,
  symbol,
  tone,
}: {
  label: string
  value: number
  symbol: string
  tone: 'ok' | 'warn' | 'bad'
}) {
  if (value <= 0) return null
  const color = tone === 'ok' ? 'var(--success)' : tone === 'warn' ? 'var(--warning)' : 'var(--danger)'
  return (
    <span
      className="badge"
      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
    >
      {label}: {money(value, symbol)}
    </span>
  )
}
