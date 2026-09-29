import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown, Plus, Receipt, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Page } from '../../components/Page'
import { Segmented } from '../../components/fields'
import { Button, EmptyState, PaymentBadge, SkeletonRows } from '../../components/ui'
import { SaleRowCard } from '../../components/rows'
import { money, MONTHS, shortDate } from '../../lib/format'
import { useCustomers, useSales } from '../../lib/queries'
import type { Sale } from '../../lib/types'
import { SaleForm } from './SaleForm'

type SalesNav = { openNew?: boolean; editSaleId?: string; month?: number; year?: number; newForCustomerId?: string }

const col = createColumnHelper<Sale>()

export function SalesPage() {
  const { company } = useAuth()
  const symbol = company?.currencySymbol ?? 'Rs'
  const now = new Date()

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(0)
  const [status, setStatus] = useState('')
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Sale | undefined>()
  const [pendingEditId, setPendingEditId] = useState<string | null>(null)
  const [presetCustomerId, setPresetCustomerId] = useState<string | undefined>()

  const location = useLocation()
  const navigate = useNavigate()

  const customers = useCustomers()
  const { data, isLoading } = useSales({
    year,
    month: month || undefined,
    status: status || undefined,
    page: 1,
    pageSize: 1000,
  })
  const rows = useMemo(() => data?.items ?? [], [data])

  const columns = useMemo(
    () => [
      col.accessor('invoiceNumber', {
        header: 'Invoice #',
        cell: (c) => <span className="font-medium tabular whitespace-nowrap">{c.getValue()}</span>,
      }),
      col.accessor('date', {
        header: 'Date',
        cell: (c) => <span className="whitespace-nowrap">{shortDate(c.getValue())}</span>,
      }),
      col.accessor('customerName', {
        header: 'Customer',
        cell: (c) => <span className="whitespace-nowrap">{c.getValue()}</span>,
      }),
      col.accessor('amount', {
        header: 'Amount',
        cell: (c) => <span className="tabular">{money(c.getValue(), symbol)}</span>,
      }),
      col.accessor('outstanding', {
        header: 'Outstanding',
        cell: (c) => (
          <span className="tabular" style={{ color: c.getValue() > 0 ? 'var(--color-warning)' : undefined }}>
            {money(c.getValue(), symbol)}
          </span>
        ),
      }),
      col.accessor('paymentStatus', {
        header: 'Status',
        cell: (c) => <PaymentBadge status={c.getValue()} />,
        sortingFn: (a, b) => a.original.paymentStatus.localeCompare(b.original.paymentStatus),
      }),
      col.accessor('paymentMethod', {
        header: 'Method',
        cell: (c) => c.getValue() ?? <span className="text-tertiary">—</span>,
      }),
    ],
    [symbol],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 12 } },
  })

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  const openEdit = (s: Sale) => {
    setEditing(s)
    setFormOpen(true)
  }

  // Consume navigation intent from other pages (dashboard) exactly once.
  const consumed = useRef(false)
  useEffect(() => {
    if (consumed.current) return
    consumed.current = true
    const st = location.state as SalesNav | null
    if (!st) return
    if (st.year) setYear(st.year)
    if (st.month != null) setMonth(st.month)
    if (st.newForCustomerId) setPresetCustomerId(st.newForCustomerId)
    if (st.openNew || st.newForCustomerId) openNew()
    if (st.editSaleId) setPendingEditId(st.editSaleId)
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Open a specific sale once its row has loaded.
  useEffect(() => {
    if (!pendingEditId || rows.length === 0) return
    const s = rows.find((r) => r.id === pendingEditId)
    if (s) {
      openEdit(s)
      setPendingEditId(null)
    }
  }, [pendingEditId, rows])

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)
  const noCustomers = customers.data && customers.data.length === 0
  const pageIndex = table.getState().pagination.pageIndex
  const pageCount = table.getPageCount()

  return (
    <Page
      title="Sales"
      subtitle={data ? `${rows.length} record${rows.length === 1 ? '' : 's'} in view` : undefined}
      action={
        <Button onClick={openNew} disabled={noCustomers}>
          <Plus size={18} /> New sale
        </Button>
      }
    >
      {/* Month tabs */}
      <div className="flex gap-1 p-1 bg-base-200 rounded-xl overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[{ v: 0, l: 'All' }, ...MONTHS.map((m, i) => ({ v: i + 1, l: m.slice(0, 3) }))].map((t) => (
          <button
            key={t.v}
            onClick={() => setMonth(t.v)}
            className={`flex-1 min-w-[52px] px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              month === t.v
                ? 'bg-neutral text-neutral-content'
                : 'text-base-content/70 hover:bg-base-100'
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Search + year + status */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="input flex items-center gap-2 flex-1 min-w-[220px]">
          <Search size={18} className="opacity-60 shrink-0" />
          <input
            className="grow"
            placeholder="Search invoice or customer…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </label>
        <select className="select w-28" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <Segmented
          value={status}
          onChange={setStatus}
          size="md"
          options={[
            { value: '', label: 'All' },
            { value: 'Unpaid', label: 'Unpaid' },
            { value: 'Partial', label: 'Partial' },
            { value: 'Paid', label: 'Paid' },
          ]}
        />
      </div>

      {/* Grid */}
      {noCustomers ? (
        <div className="panel">
          <EmptyState icon={Receipt} title="Add a customer first" subtitle="You need a customer before recording a sale." />
        </div>
      ) : isLoading ? (
        <SkeletonRows count={8} />
      ) : rows.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Receipt}
            title="No sales found"
            subtitle="Try different filters, or record a new sale."
            action={<Button onClick={openNew}><Plus size={18} /> New sale</Button>}
          />
        </div>
      ) : (
        <div className="panel overflow-hidden">
          {/* Mobile: card rows (no horizontal scroll) */}
          <div className="lg:hidden">
            {table.getRowModel().rows.map((r) => (
              <SaleRowCard key={r.id} sale={r.original} symbol={symbol} onClick={() => openEdit(r.original)} />
            ))}
          </div>
          {/* Desktop: full table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="table">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => {
                      const sorted = h.column.getIsSorted()
                      return (
                        <th
                          key={h.id}
                          className="cursor-pointer select-none whitespace-nowrap hover:text-primary transition-colors"
                          onClick={h.column.getToggleSortingHandler()}
                        >
                          <span className="inline-flex items-center gap-1">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {sorted === 'asc' ? (
                              <ArrowUp size={14} />
                            ) : sorted === 'desc' ? (
                              <ArrowDown size={14} />
                            ) : (
                              <ChevronsUpDown size={13} className="opacity-30" />
                            )}
                          </span>
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-base-200 cursor-pointer transition-colors"
                    onClick={() => openEdit(r.original)}
                  >
                    {r.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-base-300">
              <span className="footnote text-secondary">
                Page {pageIndex + 1} of {pageCount}
              </span>
              <div className="join">
                <button className="btn btn-sm join-item" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
                  Prev
                </button>
                <button className="btn btn-sm join-item" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {formOpen && (
        <SaleForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false)
            setPresetCustomerId(undefined)
          }}
          sale={editing}
          customers={customers.data ?? []}
          presetCustomerId={presetCustomerId}
        />
      )}
    </Page>
  )
}
