import { ChevronRight, Plus, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Page } from '../../components/Page'
import { Button, EmptyState, SkeletonRows } from '../../components/ui'
import { money } from '../../lib/format'
import { useCustomers } from '../../lib/queries'
import { CustomerForm } from './CustomerForm'

export function CustomersPage() {
  const { company } = useAuth()
  const symbol = company?.currencySymbol ?? 'Rs'
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const { data, isLoading } = useCustomers(q || undefined)

  return (
    <Page
      title="Customers"
      subtitle={data ? `${data.length} customer${data.length === 1 ? '' : 's'}` : undefined}
      action={<Button onClick={() => setFormOpen(true)}><Plus size={18} /> New customer</Button>}
    >
      <label className="input flex items-center gap-2 w-full max-w-md">
        <Search size={18} className="opacity-60 shrink-0" />
        <input className="grow" placeholder="Search name or tax ID…" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      {isLoading ? (
        <SkeletonRows count={8} />
      ) : data && data.length > 0 ? (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>{company?.taxIdLabel ?? 'Tax ID'}</th>
                  <th>City</th>
                  <th className="text-right">Total sales</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-base-200 cursor-pointer transition-colors"
                    onClick={() => navigate(`/customers/${c.id}`)}
                  >
                    <td className="font-medium">{c.name}</td>
                    <td className="text-secondary">{c.taxId ?? '—'}</td>
                    <td className="text-secondary">{c.city ?? '—'}</td>
                    <td className="text-right tabular font-semibold">{money(c.totalSales, symbol)}</td>
                    <td className="w-8 text-tertiary"><ChevronRight size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            icon={Users}
            title={q ? 'No matches' : 'No customers yet'}
            subtitle={q ? 'Try a different search.' : 'Add your first customer to start recording sales.'}
            action={!q ? <Button onClick={() => setFormOpen(true)}><Plus size={18} /> Add customer</Button> : undefined}
          />
        </div>
      )}

      {formOpen && <CustomerForm open={formOpen} onClose={() => setFormOpen(false)} />}
    </Page>
  )
}
