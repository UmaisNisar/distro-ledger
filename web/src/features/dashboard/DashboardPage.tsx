import { CalendarRange, Plus, TrendingUp, Users, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { MonthBarChart } from '../../components/MonthBarChart'
import { Page } from '../../components/Page'
import { Button, EmptyState, LinkAction, PaymentBadge, SkeletonRows, StatTile } from '../../components/ui'
import { SaleRowCard } from '../../components/rows'
import { money, moneyCompact, num, shortDate } from '../../lib/format'
import { useCustomers, useOverview, useSales } from '../../lib/queries'
import { SaleForm } from '../sales/SaleForm'

export function DashboardPage() {
  const { company } = useAuth()
  const navigate = useNavigate()
  const symbol = company?.currencySymbol ?? 'Rs'
  const year = new Date().getFullYear()
  const { data, isLoading } = useOverview()
  const recent = useSales({ pageSize: 8, page: 1 })
  const customers = useCustomers()
  const [formOpen, setFormOpen] = useState(false)
  const noCustomers = customers.data && customers.data.length === 0

  const trend = data?.trend ?? []
  // Default the selected bar to the latest month that has sales.
  const defaultSel = useMemo(() => {
    if (!trend.length) return new Date().getMonth()
    for (let i = trend.length - 1; i >= 0; i--) if (trend[i].total > 0) return i
    return new Date().getMonth()
  }, [trend])
  const [sel, setSel] = useState<number | null>(null)
  const selected = sel ?? defaultSel

  const selMonth = trend[selected]
  const prevMonth = selected > 0 ? trend[selected - 1] : undefined
  const delta =
    prevMonth && prevMonth.total > 0 && selMonth && selMonth.total > 0
      ? ((selMonth.total - prevMonth.total) / prevMonth.total) * 100
      : null

  const topCustomers = useMemo(() => {
    const list = [...(customers.data ?? [])].filter((c) => c.totalSales > 0)
    list.sort((a, b) => b.totalSales - a.totalSales)
    return list.slice(0, 6)
  }, [customers.data])
  const topMax = topCustomers[0]?.totalSales ?? 1

  const goMonth = (m: number) => navigate('/sales', { state: { month: m + 1, year } })
  const openSale = (id: string) => navigate('/sales', { state: { editSaleId: id } })

  return (
    <Page
      eyebrow="Dashboard"
      title={`Sales overview, ${year}`}
      action={
        <div className="flex items-center gap-3">
          <span className="hidden sm:block footnote text-secondary">As of {shortDate(new Date().toISOString())}</span>
          <Button onClick={() => setFormOpen(true)} disabled={noCustomers}>
            <Plus size={18} /> New sale
          </Button>
        </div>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="panel h-[104px] skeleton" />)
        ) : (
          <>
            <StatTile icon={TrendingUp} label="This month" value={moneyCompact(data.monthSales, symbol)} hint={`${data.monthTransactions} sales`} invert onClick={() => goMonth(new Date().getMonth())} tip="Total sales recorded this calendar month" />
            <StatTile icon={CalendarRange} label="This year" value={moneyCompact(data.yearSales, symbol)} hint={`${trend.reduce((a, m) => a + m.transactions, 0)} sales`} onClick={() => navigate('/sales')} tip={`Total sales recorded in ${year}`} />
            <StatTile icon={Wallet} label="Outstanding" value={moneyCompact(data.totalOutstanding, symbol)} hint="receivables" onClick={() => navigate('/receivables')} tip="Unpaid balance across all invoices" />
            <StatTile icon={Users} label="Customers" value={String(data.customerCount)} hint="on file" onClick={() => navigate('/customers')} tip="Customers on file" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="panel p-6 lg:col-span-2 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="title-2">Monthly sales</h2>
              <p className="subhead text-secondary mt-1">
                {selMonth ? (
                  <>
                    {selMonth.monthName} · <span className="tabular text-base-content">{money(selMonth.total, symbol)}</span> · {selMonth.transactions} sales
                    {delta !== null && (
                      <span style={{ color: delta >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {' · '}{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs {prevMonth!.monthName.slice(0, 3)}
                      </span>
                    )}
                  </>
                ) : (
                  'No data yet'
                )}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => goMonth(selected)}>Open in ledger</Button>
          </div>
          {isLoading || !data ? (
            <div className="skeleton h-[240px] w-full rounded-xl" />
          ) : (
            <MonthBarChart data={trend} selected={selected} onSelect={setSel} />
          )}
        </div>

        {/* Top customers */}
        <div className="panel p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="title-2">Top customers</h2>
            <LinkAction onClick={() => navigate('/customers')}>All customers</LinkAction>
          </div>
          {customers.isLoading ? (
            <SkeletonRows count={5} />
          ) : topCustomers.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {topCustomers.map((c) => (
                <button key={c.id} className="flex flex-col gap-2 text-left" onClick={() => navigate(`/customers/${c.id}`)}>
                  <div className="flex justify-between gap-3">
                    <span className="text-[0.95rem] font-medium truncate" title={c.name}>{c.name}</span>
                    <span className="tabular text-[0.95rem] shrink-0">{num(c.totalSales)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-base-300 overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((c.totalSales / topMax) * 100)}%` }} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="No customers yet" />
          )}
        </div>
      </div>

      {/* Latest sales */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="title-2">Latest sales</h2>
          <LinkAction onClick={() => navigate('/sales')}>Open ledger</LinkAction>
        </div>
        {recent.isLoading ? (
          <div className="px-4 pb-4"><SkeletonRows count={5} /></div>
        ) : recent.data && recent.data.items.length > 0 ? (
          <>
            {/* Mobile: card rows */}
            <div className="md:hidden">
              {recent.data.items.map((s) => (
                <SaleRowCard key={s.id} sale={s} symbol={symbol} onClick={() => openSale(s.id)} />
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Invoice #</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.data.items.map((s) => (
                    <tr key={s.id} className="hover:bg-base-200 cursor-pointer transition-colors" onClick={() => openSale(s.id)}>
                      <td className="text-secondary whitespace-nowrap">{shortDate(s.date)}</td>
                      <td className="font-medium">{s.customerName}</td>
                      <td className="tabular text-secondary whitespace-nowrap">{s.invoiceNumber}</td>
                      <td className="text-right tabular font-semibold">{money(s.amount, symbol)}</td>
                      <td><PaymentBadge status={s.paymentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState icon={TrendingUp} title="No sales yet" subtitle="Add your first sale to see it here." />
        )}
      </div>

      {formOpen && (
        <SaleForm open={formOpen} onClose={() => setFormOpen(false)} customers={customers.data ?? []} />
      )}
    </Page>
  )
}
