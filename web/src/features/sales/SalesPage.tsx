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
import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Page } from '../../components/Page'
import { Segmented } from '../../components/fields'
import { Button, EmptyState, PaymentBadge, SkeletonRows } from '../../components/ui'
import { money, MONTHS, shortDate } from '../../lib/format'
import { useCustomers, useSales } from '../../lib/queries'
import type { Sale } from '../../lib/types'
import { SaleForm } from './SaleForm'

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
      {/* Toolbar — one wrapping row */}
      <div className="panel p-3 flex flex-wrap items-center gap-3">
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
        <select className="select w-40" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          <option value={0}>All months</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
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
          <div className="overflow-x-auto">
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
        <SaleForm open={formOpen} onClose={() => setFormOpen(false)} sale={editing} customers={customers.data ?? []} />
      )}
    </Page>
  )
}
