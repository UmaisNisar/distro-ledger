import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Page } from '../../components/Page'
import { Button, EmptyState, SectionHeader, SkeletonRows, StatTile } from '../../components/ui'
import { money } from '../../lib/format'
import { useCustomer, useCustomerSummary, useDeleteCustomer } from '../../lib/queries'
import { apiErrorMessage } from '../../lib/api'
import { CustomerForm } from './CustomerForm'

export function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { company } = useAuth()
  const symbol = company?.currencySymbol ?? 'Rs'
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [editOpen, setEditOpen] = useState(false)

  const customer = useCustomer(id)
  const summary = useCustomerSummary(id, year)
  const del = useDeleteCustomer()

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  const onDelete = async () => {
    if (!id || !confirm('Delete this customer?')) return
    try {
      await del.mutateAsync(id)
      navigate('/customers')
    } catch (e) {
      alert(apiErrorMessage(e))
    }
  }

  return (
    <Page
      title={customer.data?.name ?? 'Customer'}
      action={
        <Button variant="ghost" onClick={() => navigate('/customers')}>
          Back
        </Button>
      }
    >
      {customer.isLoading || !customer.data ? (
        <SkeletonRows count={3} />
      ) : (
        <>
          {/* Info */}
          <div className="inset-group">
            <InfoRow label={company?.taxIdLabel ?? 'Tax ID'} value={customer.data.taxId ?? '—'} />
            <InfoRow label="Phone" value={customer.data.phone ?? '—'} />
            <InfoRow label="City" value={customer.data.city ?? '—'} />
            <InfoRow label="Address" value={customer.data.address ?? '—'} />
            {customer.data.otherIds && <InfoRow label="Other IDs" value={customer.data.otherIds} />}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" block onClick={() => setEditOpen(true)}>Edit</Button>
            <Button variant="danger" onClick={onDelete} loading={del.isPending}>Delete</Button>
          </div>

          {/* Year breakdown (Lookup tab) */}
          <div className="flex items-center justify-between mt-2">
            <SectionHeader>Sales by month</SectionHeader>
            <select
              className="field-input"
              style={{ width: 'auto', height: 36, paddingRight: 30 }}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {summary.isLoading || !summary.data ? (
            <SkeletonRows count={6} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatTile label={`${year} sales`} value={money(summary.data.yearSales, symbol)} accent />
                <StatTile label="Transactions" value={String(summary.data.yearTransactions)} />
              </div>

              {summary.data.yearTransactions === 0 ? (
                <div className="card">
                  <EmptyState title="No sales this year" subtitle={`Nothing recorded for ${year}.`} />
                </div>
              ) : (
                <div className="inset-group">
                  {summary.data.months
                    .filter((m) => m.transactions > 0)
                    .map((m) => (
                      <div key={m.month} className="list-row">
                        <span className="subhead" style={{ fontWeight: 600 }}>{m.monthName}</span>
                        <span className="ml-auto footnote text-secondary">{m.transactions} sales</span>
                        <span className="subhead ml-4" style={{ fontWeight: 600 }}>{money(m.sales, symbol)}</span>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {editOpen && customer.data && (
        <CustomerForm open={editOpen} onClose={() => setEditOpen(false)} customer={customer.data} />
      )}
    </Page>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="list-row">
      <span className="subhead text-secondary">{label}</span>
      <span className="subhead ml-auto text-right" style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}
