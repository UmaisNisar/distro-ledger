import { CalendarRange, Plus, TrendingUp, Users, Wallet } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useAuth } from '../../auth/AuthContext'
import { Page } from '../../components/Page'
import { Button, EmptyState, PaymentBadge, SectionHeader, SkeletonRows, StatTile } from '../../components/ui'
import { money, moneyCompact, shortDate } from '../../lib/format'
import { useOverview, useSales } from '../../lib/queries'

export function DashboardPage() {
  const { company } = useAuth()
  const navigate = useNavigate()
  const symbol = company?.currencySymbol ?? 'Rs'
  const accent = company?.themeColor ?? '#2563EB'
  const { data, isLoading } = useOverview()
  const recent = useSales({ pageSize: 6, page: 1 })

  return (
    <Page
      title={`Welcome back${company ? `, ${company.name}` : ''}`}
      subtitle="Here's how your business is doing"
      action={<Button onClick={() => navigate('/sales')}><Plus size={18} /> New sale</Button>}
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="panel h-[92px] skeleton" />)
        ) : (
          <>
            <StatTile icon={TrendingUp} label="This month" value={money(data.monthSales, symbol)} hint={`${data.monthTransactions} sales`} accent />
            <StatTile icon={CalendarRange} label="This year" value={moneyCompact(data.yearSales, symbol)} />
            <StatTile icon={Wallet} label="Outstanding" value={money(data.totalOutstanding, symbol)} hint="receivables" />
            <StatTile icon={Users} label="Customers" value={String(data.customerCount)} />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="panel p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="headline">Monthly sales</h2>
            <span className="footnote text-secondary">{new Date().getFullYear()}</span>
          </div>
          <div className="text-base-content flex-1 min-h-[240px]">
            {data && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trend} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                  <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                  <XAxis
                    dataKey="monthName"
                    tickFormatter={(m: string) => m.slice(0, 3)}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                    interval={0}
                  />
                  <Tooltip
                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                    contentStyle={{
                      background: 'var(--color-base-100)',
                      border: '1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent)',
                      borderRadius: 12,
                      fontSize: 13,
                      color: 'var(--color-base-content)',
                    }}
                    formatter={(v) => [money(Number(v), symbol), 'Sales']}
                  />
                  <Bar dataKey="total" fill={accent} radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent sales */}
        <div className="panel p-5">
          <SectionHeader action={<Link to="/sales" className="footnote link link-primary no-underline">See all</Link>}>
            Recent sales
          </SectionHeader>
          {recent.isLoading ? (
            <SkeletonRows count={5} />
          ) : recent.data && recent.data.items.length > 0 ? (
            <div className="flex flex-col divide-y divide-base-200">
              {recent.data.items.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-base-200 -mx-2 px-2 rounded-lg transition-colors"
                  onClick={() => navigate('/sales')}
                >
                  <div className="min-w-0 flex-1">
                    <div className="subhead font-semibold truncate">{s.customerName}</div>
                    <div className="footnote text-secondary truncate">{s.invoiceNumber} · {shortDate(s.date)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="subhead font-semibold tabular">{money(s.amount, symbol)}</div>
                    <PaymentBadge status={s.paymentStatus} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={TrendingUp} title="No sales yet" subtitle="Add your first sale to see it here." />
          )}
        </div>
      </div>
    </Page>
  )
}
