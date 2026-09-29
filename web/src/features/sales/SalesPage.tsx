import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Page } from '../../components/Page'
import { Segmented } from '../../components/fields'
import { IconPlus, IconSearch } from '../../components/icons'
import { Button, EmptyState, PaymentBadge, SkeletonRows } from '../../components/ui'
import { money, MONTHS, shortDate } from '../../lib/format'
import { useCustomers, useSales } from '../../lib/queries'
import type { Sale } from '../../lib/types'
import { SaleForm } from './SaleForm'

const PAGE_SIZE = 25

export function SalesPage() {
  const { company } = useAuth()
  const symbol = company?.currencySymbol ?? 'Rs'
  const now = new Date()

  const [q, setQ] = useState('')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(0) // 0 = all
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Sale | undefined>()

  const customers = useCustomers()
  const { data, isLoading } = useSales({
    q: q || undefined,
    year,
    month: month || undefined,
    status: status || undefined,
    page,
    pageSize: PAGE_SIZE,
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
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const noCustomers = customers.data && customers.data.length === 0

  return (
    <Page
      title="Sales"
      action={
        <Button onClick={openNew} disabled={noCustomers}>
          <IconPlus width={20} height={20} /> New
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <IconSearch
            width={18}
            height={18}
            style={{ position: 'absolute', left: 12, top: 13, color: 'var(--label-tertiary)' }}
          />
          <input
            className="field-input"
            style={{ paddingLeft: 38 }}
            placeholder="Search invoice or customer"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div className="flex gap-2">
          <select
            className="field-input"
            style={{ flex: 1 }}
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value))
              setPage(1)
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            className="field-input"
            style={{ flex: 1 }}
            value={month}
            onChange={(e) => {
              setMonth(Number(e.target.value))
              setPage(1)
            }}
          >
            <option value={0}>All months</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        <Segmented
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          options={[
            { value: '', label: 'All' },
            { value: 'Unpaid', label: 'Unpaid' },
            { value: 'Partial', label: 'Partial' },
            { value: 'Paid', label: 'Paid' },
          ]}
        />
      </div>

      {/* List */}
      {noCustomers ? (
        <div className="card">
          <EmptyState
            title="Add a customer first"
            subtitle="You need at least one customer before recording a sale."
          />
        </div>
      ) : isLoading ? (
        <SkeletonRows count={8} />
      ) : data && data.items.length > 0 ? (
        <>
          <div className="inset-group">
            {data.items.map((s) => (
              <div key={s.id} className="list-row list-row-tap" onClick={() => openEdit(s)}>
                <div className="min-w-0">
                  <div className="subhead truncate" style={{ fontWeight: 600 }}>{s.customerName}</div>
                  <div className="footnote text-secondary truncate">
                    {s.invoiceNumber} · {shortDate(s.date)}
                    {s.paymentMethod ? ` · ${s.paymentMethod}` : ''}
                  </div>
                </div>
                <div className="ml-auto text-right shrink-0">
                  <div className="subhead" style={{ fontWeight: 600 }}>{money(s.amount, symbol)}</div>
                  <PaymentBadge status={s.paymentStatus} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="footnote text-secondary">
              {data.total} sale{data.total === 1 ? '' : 's'}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Prev
                </Button>
                <span className="footnote text-secondary">{page} / {totalPages}</span>
                <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card">
          <EmptyState
            title="No sales found"
            subtitle="Try clearing filters, or add a new sale."
            action={<Button onClick={openNew}>Add sale</Button>}
          />
        </div>
      )}

      {formOpen && (
        <SaleForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          sale={editing}
          customers={customers.data ?? []}
        />
      )}
    </Page>
  )
}
