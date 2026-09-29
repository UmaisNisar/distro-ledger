import { ArrowLeft, CalendarDays, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Page } from '../../components/Page'
import { useConfirm } from '../../components/ConfirmProvider'
import { Button, EmptyState, SectionHeader, SkeletonRows, StatTile } from '../../components/ui'
import { money } from '../../lib/format'
import { useCustomer, useCustomerSummary, useDeleteCustomer } from '../../lib/queries'
import { notify } from '../../lib/toast'
import { CustomerForm } from './CustomerForm'
import { Receipt, Wallet } from 'lucide-react'

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
  const confirm = useConfirm()
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  const onDelete = async () => {
    if (!id) return
    const ok = await confirm({
      title: 'Delete this customer?',
      message: `${customer.data?.name ?? 'This customer'} will be removed. Customers with existing sales cannot be deleted.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await del.mutateAsync(id)
      notify.success('Customer deleted')
      navigate('/customers')
    } catch (e) {
      notify.fromError(e)
    }
  }

  return (
    <Page
      title={customer.data?.name ?? 'Customer'}
      action={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/customers')}><ArrowLeft size={18} /> Back</Button>
          <Button variant="secondary" onClick={() => setEditOpen(true)}><Pencil size={16} /> Edit</Button>
          <Button variant="danger" onClick={onDelete} loading={del.isPending}><Trash2 size={16} /></Button>
        </div>
      }
    >
      {customer.isLoading || !customer.data ? (
        <SkeletonRows count={3} />
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="panel p-5">
              <SectionHeader>Details</SectionHeader>
              <dl className="grid grid-cols-3 gap-y-2.5 text-sm">
                <Info label={company?.taxIdLabel ?? 'Tax ID'} value={customer.data.taxId} />
                <Info label="Phone" value={customer.data.phone} />
                <Info label="City" value={customer.data.city} />
                <Info label="Address" value={customer.data.address} />
                {customer.data.otherIds && <Info label="Other IDs" value={customer.data.otherIds} />}
              </dl>
            </div>
            <div className="grid grid-cols-2 gap-4 content-start">
              <StatTile icon={Receipt} label={`${year} sales`} value={money(summary.data?.yearSales ?? 0, symbol)} accent />
              <StatTile icon={Wallet} label="Transactions" value={String(summary.data?.yearTransactions ?? 0)} />
            </div>
          </div>

          <SectionHeader
            action={
              <select className="select select-sm" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            }
          >
            Sales by month
          </SectionHeader>

          {summary.isLoading || !summary.data ? (
            <SkeletonRows count={5} />
          ) : summary.data.yearTransactions === 0 ? (
            <div className="panel">
              <EmptyState icon={CalendarDays} title="No sales this year" subtitle={`Nothing recorded for ${year}.`} />
            </div>
          ) : (
            <div className="panel overflow-hidden">
              <table className="table">
                <thead>
                  <tr><th>Month</th><th className="text-right">Transactions</th><th className="text-right">Sales</th></tr>
                </thead>
                <tbody>
                  {summary.data.months.filter((m) => m.transactions > 0).map((m) => (
                    <tr key={m.month} className="hover:bg-base-200 transition-colors">
                      <td className="font-medium">{m.monthName}</td>
                      <td className="text-right text-secondary tabular">{m.transactions}</td>
                      <td className="text-right font-semibold tabular">{money(m.sales, symbol)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {editOpen && customer.data && (
        <CustomerForm open={editOpen} onClose={() => setEditOpen(false)} customer={customer.data} />
      )}
    </Page>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <>
      <dt className="text-secondary col-span-1">{label}</dt>
      <dd className="col-span-2 font-medium break-words">{value || '—'}</dd>
    </>
  )
}
