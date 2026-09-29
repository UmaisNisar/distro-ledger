import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Page } from '../../components/Page'
import { IconChevron, IconPlus, IconSearch } from '../../components/icons'
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
      action={
        <Button onClick={() => setFormOpen(true)}>
          <IconPlus width={20} height={20} /> New
        </Button>
      }
    >
      <div className="relative">
        <IconSearch
          width={18}
          height={18}
          style={{ position: 'absolute', left: 12, top: 13, color: 'var(--label-tertiary)' }}
        />
        <input
          className="field-input"
          style={{ paddingLeft: 38 }}
          placeholder="Search name or tax ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <SkeletonRows count={8} />
      ) : data && data.length > 0 ? (
        <div className="inset-group">
          {data.map((c) => (
            <div
              key={c.id}
              className="list-row list-row-tap"
              onClick={() => navigate(`/customers/${c.id}`)}
            >
              <div className="min-w-0">
                <div className="subhead truncate" style={{ fontWeight: 600 }}>{c.name}</div>
                <div className="footnote text-secondary truncate">
                  {c.taxId ? `${company?.taxIdLabel ?? 'Tax ID'}: ${c.taxId}` : 'No tax ID'}
                  {c.city ? ` · ${c.city}` : ''}
                </div>
              </div>
              <div className="ml-auto text-right shrink-0 flex items-center gap-2">
                <div>
                  <div className="subhead" style={{ fontWeight: 600 }}>{money(c.totalSales, symbol)}</div>
                  <div className="footnote text-secondary">total</div>
                </div>
                <IconChevron width={18} height={18} style={{ color: 'var(--label-tertiary)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            title={q ? 'No matches' : 'No customers yet'}
            subtitle={q ? 'Try a different search.' : 'Add your first customer to start recording sales.'}
            action={!q ? <Button onClick={() => setFormOpen(true)}>Add customer</Button> : undefined}
          />
        </div>
      )}

      {formOpen && <CustomerForm open={formOpen} onClose={() => setFormOpen(false)} />}
    </Page>
  )
}
