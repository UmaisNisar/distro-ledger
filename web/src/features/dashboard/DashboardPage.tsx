import { Link } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useAuth } from '../../auth/AuthContext'
import { Page } from '../../components/Page'
import { EmptyState, PaymentBadge, SectionHeader, SkeletonRows, StatTile } from '../../components/ui'
import { money, moneyCompact, shortDate } from '../../lib/format'
import { useOverview, useSales } from '../../lib/queries'

export function DashboardPage() {
  const { company } = useAuth()
  const symbol = company?.currencySymbol ?? 'Rs'
  const accent = company?.themeColor ?? '#0A84FF'
  const { data, isLoading } = useOverview()
  const recent = useSales({ pageSize: 5, page: 1 })

  return (
    <Page title="Overview">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-4 h-[92px] skeleton" />)
        ) : (
          <>
            <StatTile label="This month" value={money(data.monthSales, symbol)} hint={`${data.monthTransactions} sales`} accent />
            <StatTile label="This year" value={moneyCompact(data.yearSales, symbol)} />
            <StatTile label="Outstanding" value={money(data.totalOutstanding, symbol)} hint="receivables" />
            <StatTile label="Customers" value={String(data.customerCount)} />
          </>
        )}
      </div>

      {/* Trend chart */}
      <div className="card p-4">
        <div className="footnote text-secondary mb-3">Monthly sales · {new Date().getFullYear()}</div>
        <div style={{ height: 180 }}>
          {data && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <XAxis
                  dataKey="monthName"
                  tickFormatter={(m: string) => m.slice(0, 1)}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--label-tertiary)' }}
                  interval={0}
                />
                <Tooltip
                  cursor={{ fill: 'var(--fill)' }}
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '0.5px solid var(--separator)',
                    borderRadius: 10,
                    fontSize: 13,
                    color: 'var(--label)',
                  }}
                  labelStyle={{ color: 'var(--label)' }}
                  formatter={(v) => [money(Number(v), symbol), 'Sales']}
                />
                <Bar dataKey="total" fill={accent} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent sales */}
      <div>
        <div className="flex items-center justify-between">
          <SectionHeader>Recent sales</SectionHeader>
          <Link to="/sales" className="footnote pr-4" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            See all
          </Link>
        </div>
        {recent.isLoading ? (
          <SkeletonRows count={5} />
        ) : recent.data && recent.data.items.length > 0 ? (
          <div className="inset-group">
            {recent.data.items.map((s) => (
              <div key={s.id} className="list-row">
                <div className="min-w-0">
                  <div className="subhead truncate" style={{ fontWeight: 600 }}>{s.customerName}</div>
                  <div className="footnote text-secondary truncate">
                    {s.invoiceNumber} · {shortDate(s.date)}
                  </div>
                </div>
                <div className="ml-auto text-right shrink-0">
                  <div className="subhead" style={{ fontWeight: 600 }}>{money(s.amount, symbol)}</div>
                  <PaymentBadge status={s.paymentStatus} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <EmptyState title="No sales yet" subtitle="Add your first sale from the Sales tab." />
          </div>
        )}
      </div>
    </Page>
  )
}
