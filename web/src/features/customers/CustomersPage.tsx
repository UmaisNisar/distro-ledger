import { CalendarDays, ChevronLeft, Pencil, Plus, Receipt, Search, Trash2, Users, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useConfirm } from '../../components/ConfirmProvider'
import { MonthBarChart } from '../../components/MonthBarChart'
import { Page } from '../../components/Page'
import { Segmented } from '../../components/fields'
import { Button, EmptyState, PaymentBadge, SkeletonRows, StatTile } from '../../components/ui'
import { SaleRowCard } from '../../components/rows'
import { compactAmount, dayMonth, money, moneyCompact, shortDate } from '../../lib/format'
import {
  useCustomer,
  useCustomers,
  useCustomerSummary,
  useDeleteCustomer,
  useSales,
} from '../../lib/queries'
import { notify } from '../../lib/toast'
import { CustomerForm } from './CustomerForm'

function initials(name: string): string {
  const w = name
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((x) => x && x.length > 1 && !/^\d+$/.test(x))
  return ((w[0]?.[0] ?? '?') + (w[1]?.[0] ?? '')).toUpperCase()
}

export function CustomersPage() {
  const { company } = useAuth()
  const symbol = company?.currencySymbol ?? 'Rs'
  const navigate = useNavigate()
  const { id: routeId } = useParams()
  const confirm = useConfirm()
  const del = useDeleteCustomer()

  const year = new Date().getFullYear()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'az' | 'top'>('az')
  const [selectedId, setSelectedId] = useState<string | undefined>(routeId)
  const [formOpen, setFormOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [salesPage, setSalesPage] = useState(1)
  const SALES_PER_PAGE = 10
  // Mobile is a master→detail flow: the list, then the selected customer full-screen.
  const [mobileDetail, setMobileDetail] = useState(false)

  const list = useCustomers(q || undefined)
  const rows = useMemo(() => {
    const arr = [...(list.data ?? [])]
    arr.sort(sort === 'az' ? (a, b) => a.name.localeCompare(b.name) : (a, b) => b.totalSales - a.totalSales)
    return arr
  }, [list.data, sort])

  // Keep a valid selection: from the route, else the first row.
  useEffect(() => {
    if (routeId) setSelectedId(routeId)
  }, [routeId])
  useEffect(() => {
    if (!selectedId && rows.length) setSelectedId(rows[0].id)
  }, [rows, selectedId])

  const detail = useCustomer(selectedId)
  const summary = useCustomerSummary(selectedId, year)
  const detailSales = useSales({ customerId: selectedId, year, pageSize: 1000 })

  // Reset the sales list to page 1 whenever the selected customer changes.
  useEffect(() => {
    setSalesPage(1)
  }, [selectedId])

  const select = (cid: string) => {
    setSelectedId(cid)
    setMobileDetail(true)
    navigate(`/customers/${cid}`, { replace: true })
  }

  const onDelete = async () => {
    if (!detail.data) return
    const ok = await confirm({
      title: `Delete ${detail.data.name}?`,
      message: 'Customers with existing sales cannot be deleted.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await del.mutateAsync(detail.data.id)
      notify.success('Customer deleted')
      setSelectedId(undefined)
      navigate('/customers', { replace: true })
    } catch (e) {
      notify.fromError(e)
    }
  }

  const chartData = (summary.data?.months ?? []).map((m) => ({
    monthName: m.monthName,
    total: m.sales,
    transactions: m.transactions,
  }))
  const lastSale = detailSales.data?.items[0]?.date

  const allDetailSales = detailSales.data?.items ?? []
  const salesPageCount = Math.max(1, Math.ceil(allDetailSales.length / SALES_PER_PAGE))
  const pagedSales = allDetailSales.slice((salesPage - 1) * SALES_PER_PAGE, salesPage * SALES_PER_PAGE)

  return (
    <Page
      title="Customers"
      subtitle={list.data ? `${list.data.length} on file` : undefined}
      action={<Button onClick={() => setFormOpen(true)}><Plus size={18} /> New customer</Button>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-4 items-start">
        {/* List (hidden on mobile once a customer is opened) */}
        <div className={`panel p-4 flex-col gap-3 min-w-0 ${mobileDetail ? 'hidden lg:flex' : 'flex'}`}>
          <label className="input flex items-center gap-2 w-full">
            <Search size={18} className="opacity-60 shrink-0" />
            <input className="grow" placeholder="Search name or tax ID…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <Segmented
            value={sort}
            onChange={setSort}
            size="md"
            options={[
              { value: 'az', label: 'A–Z' },
              { value: 'top', label: 'Top sales' },
            ]}
          />
          <div className="flex flex-col gap-1 min-h-[200px] lg:max-h-[64vh] lg:overflow-y-auto -mx-1 px-1">
            {list.isLoading ? (
              <SkeletonRows count={6} />
            ) : rows.length === 0 ? (
              <div className="py-8"><EmptyState icon={Users} title={q ? 'No matches' : 'No customers yet'} /></div>
            ) : (
              rows.map((c) => {
                const active = c.id === selectedId
                return (
                  <button
                    key={c.id}
                    onClick={() => select(c.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                      active ? 'bg-base-200 ring-1 ring-primary' : 'hover:bg-base-200'
                    }`}
                  >
                    <span className="grid place-items-center rounded-full text-[0.78rem] font-semibold"
                      style={{ width: 36, height: 36, flexShrink: 0, background: 'color-mix(in oklab, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}>
                      {initials(c.name)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[0.95rem] font-medium truncate" title={c.name}>{c.name}</span>
                      <span className="block footnote text-secondary truncate">
                        {c.taxId ? `${company?.taxIdLabel ?? 'Tax ID'} ${c.taxId}` : c.city || 'No tax ID'}
                      </span>
                    </span>
                    <span className="tabular text-[0.85rem] shrink-0" title={money(c.totalSales, symbol)}>{compactAmount(c.totalSales)}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Detail (full-screen on mobile once opened) */}
        <div className={`min-w-0 ${mobileDetail ? '' : 'hidden lg:block'}`}>
          <button
            type="button"
            onClick={() => setMobileDetail(false)}
            className="lg:hidden inline-flex items-center gap-1 mb-3 text-sm font-semibold text-secondary hover:text-base-content transition-colors"
          >
            <ChevronLeft size={16} /> All customers
          </button>
          {!detail.data ? (
            <div className="panel"><SkeletonRows count={5} /></div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="panel p-6 flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="title-2">{detail.data.name}</h2>
                  <p className="subhead text-secondary mt-1 tabular">
                    {detail.data.taxId ? `${company?.taxIdLabel ?? 'Tax ID'} ${detail.data.taxId}` : 'No tax ID on file'}
                    {detail.data.city ? ` · ${detail.data.city}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}><Pencil size={16} /> Edit</Button>
                  <Button variant="danger" size="sm" onClick={onDelete} loading={del.isPending} className="tooltip tooltip-bottom" data-tip="Delete customer" aria-label="Delete customer"><Trash2 size={16} /></Button>
                  <Button size="sm" onClick={() => navigate('/sales', { state: { newForCustomerId: detail.data!.id } })}>
                    <Plus size={16} /> New sale
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatTile size="sm" icon={Receipt} label={`${year} total`} value={moneyCompact(summary.data?.yearSales ?? 0, symbol)} invert />
                <StatTile size="sm" icon={Wallet} label="Sales" value={String(summary.data?.yearTransactions ?? 0)} />
                <StatTile size="sm" icon={CalendarDays} label="Last sale" value={lastSale ? dayMonth(lastSale) : '—'} />
              </div>

              <div className="flex flex-col gap-2">
                <span className="section-header">Sales by month · {year}</span>
                {summary.isLoading ? (
                  <div className="skeleton h-[120px] w-full rounded-xl" />
                ) : (
                  <MonthBarChart data={chartData} selected={-1} onSelect={() => {}} height={130} />
                )}
              </div>
            </div>

            {/* Sales list */}
            <div className="panel overflow-hidden min-h-[260px]">
              {detailSales.isLoading ? (
                <div className="p-4"><SkeletonRows count={4} /></div>
              ) : detailSales.data && detailSales.data.items.length > 0 ? (
                <>
                  {/* Mobile: card rows */}
                  <div className="md:hidden">
                    {pagedSales.map((s) => (
                      <SaleRowCard key={s.id} sale={s} symbol={symbol} onClick={() => navigate('/sales', { state: { editSaleId: s.id } })} />
                    ))}
                  </div>
                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Invoice #</th>
                          <th className="text-right">Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedSales.map((s) => (
                          <tr key={s.id} className="hover:bg-base-200 cursor-pointer transition-colors" onClick={() => navigate('/sales', { state: { editSaleId: s.id } })}>
                            <td className="text-secondary whitespace-nowrap">{shortDate(s.date)}</td>
                            <td className="tabular text-secondary whitespace-nowrap">{s.invoiceNumber}</td>
                            <td className="text-right tabular font-semibold" title={money(s.amount, symbol)}>{moneyCompact(s.amount, symbol)}</td>
                            <td><PaymentBadge status={s.paymentStatus} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {salesPageCount > 1 && (
                    <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-base-300">
                      <span className="footnote text-secondary">
                        Page {salesPage} of {salesPageCount} · {allDetailSales.length} sales
                      </span>
                      <div className="join">
                        <button className="btn btn-sm join-item" disabled={salesPage <= 1} onClick={() => setSalesPage((p) => Math.max(1, p - 1))}>
                          Prev
                        </button>
                        <button className="btn btn-sm join-item" disabled={salesPage >= salesPageCount} onClick={() => setSalesPage((p) => Math.min(salesPageCount, p + 1))}>
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState icon={CalendarDays} title="No sales this year" subtitle={`Nothing recorded for ${year}.`} />
              )}
            </div>
          </div>
          )}
        </div>
      </div>

      {formOpen && <CustomerForm open={formOpen} onClose={() => setFormOpen(false)} />}
      {editOpen && detail.data && (
        <CustomerForm open={editOpen} onClose={() => setEditOpen(false)} customer={detail.data} />
      )}
    </Page>
  )
}
