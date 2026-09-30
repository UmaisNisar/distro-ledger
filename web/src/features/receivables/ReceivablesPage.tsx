import { CheckCircle2, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Page } from '../../components/Page'
import { EmptyState, SkeletonRows, StatTile } from '../../components/ui'
import { money, moneyCompact, shortDate } from '../../lib/format'
import { useReceivables } from '../../lib/queries'

export function ReceivablesPage() {
  const { company } = useAuth()
  const symbol = company?.currencySymbol ?? 'Rs'
  const navigate = useNavigate()
  const { data, isLoading } = useReceivables()

  return (
    <Page title="Receivables" subtitle="Outstanding balances by customer">
      {isLoading || !data ? (
        <SkeletonRows count={6} />
      ) : data.customers.length === 0 ? (
        <div className="panel">
          <EmptyState icon={CheckCircle2} title="All settled" subtitle="No outstanding balances right now." />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 stagger">
            <StatTile icon={Wallet} label="Total outstanding" value={moneyCompact(data.totalOutstanding, symbol)} accent />
            <StatTile label="Customers owing" value={String(data.customers.length)} />
            <StatTile
              label="Over 90 days"
              value={moneyCompact(data.customers.reduce((s, c) => s + c.days90Plus, 0), symbol)}
            />
          </div>

          {/* Mobile: card rows */}
          <div className="panel overflow-hidden md:hidden">
            {data.customers.map((c) => (
              <button
                key={c.customerId}
                onClick={() => navigate(`/customers/${c.customerId}`)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left border-b border-base-200 last:border-0 hover:bg-base-200 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block text-[0.95rem] font-medium truncate">{c.customerName}</span>
                  <span className="block footnote text-secondary">
                    {c.openInvoices} open{c.oldestDate ? ` · oldest ${shortDate(c.oldestDate)}` : ''}
                  </span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block tabular font-bold" title={money(c.outstanding, symbol)}>{moneyCompact(c.outstanding, symbol)}</span>
                  {c.days90Plus > 0 && (
                    <span className="block footnote" style={{ color: 'var(--color-error)' }} title={money(c.days90Plus, symbol)}>
                      {moneyCompact(c.days90Plus, symbol)} over 90d
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Desktop: aging table */}
          <div className="panel overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th className="text-right">≤30d</th>
                    <th className="text-right">31–60</th>
                    <th className="text-right">61–90</th>
                    <th className="text-right">90+</th>
                    <th className="text-right">Outstanding</th>
                    <th>Oldest</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customers.map((c) => (
                    <tr
                      key={c.customerId}
                      className="hover:bg-base-200 cursor-pointer transition-colors"
                      onClick={() => navigate(`/customers/${c.customerId}`)}
                    >
                      <td className="font-medium">
                        {c.customerName}
                        <div className="footnote text-tertiary">{c.openInvoices} open</div>
                      </td>
                      <Cell v={c.current} symbol={symbol} />
                      <Cell v={c.days31To60} symbol={symbol} warn />
                      <Cell v={c.days61To90} symbol={symbol} warn />
                      <Cell v={c.days90Plus} symbol={symbol} bad />
                      <td className="text-right font-bold tabular" title={money(c.outstanding, symbol)}>{moneyCompact(c.outstanding, symbol)}</td>
                      <td className="text-secondary whitespace-nowrap">{c.oldestDate ? shortDate(c.oldestDate) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Page>
  )
}

function Cell({ v, symbol, warn, bad }: { v: number; symbol: string; warn?: boolean; bad?: boolean }) {
  return (
    <td className="text-right tabular" title={v > 0 ? money(v, symbol) : undefined} style={{ color: v <= 0 ? 'var(--color-base-content)' : bad ? 'var(--color-error)' : warn ? 'var(--color-warning)' : undefined, opacity: v <= 0 ? 0.35 : 1 }}>
      {v > 0 ? moneyCompact(v, symbol) : '—'}
    </td>
  )
}
