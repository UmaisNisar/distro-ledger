import { useState } from 'react'
import { useAdmin } from '../../auth/AdminContext'
import { Page } from '../../components/Page'
import { IconPlus, IconTrash } from '../../components/icons'
import { Button, EmptyState, SkeletonRows } from '../../components/ui'
import { apiErrorMessage } from '../../lib/api'
import { useCompanies, useDeleteCompany, useResetPassword } from '../../lib/adminQueries'
import { money, shortDate } from '../../lib/format'
import type { CompanyAdmin, CompanyCredentials } from '../../lib/types'
import { CreateCompanyForm } from './CreateCompanyForm'
import { CredentialsModal } from './CredentialsModal'

export function AdminDashboard() {
  const { username, logout } = useAdmin()
  const { data, isLoading } = useCompanies()
  const reset = useResetPassword()
  const del = useDeleteCompany()
  const [createOpen, setCreateOpen] = useState(false)
  const [credentials, setCredentials] = useState<CompanyCredentials | null>(null)

  const onReset = async (c: CompanyAdmin) => {
    if (!confirm(`Reset the password for ${c.name}? Their current password stops working.`)) return
    try {
      setCredentials(await reset.mutateAsync(c.id))
    } catch (e) {
      alert(apiErrorMessage(e))
    }
  }

  const onDelete = async (c: CompanyAdmin) => {
    if (!confirm(`Delete ${c.name}? This permanently removes all their customers and sales.`)) return
    try {
      await del.mutateAsync(c.id)
    } catch (e) {
      alert(apiErrorMessage(e))
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-8 pb-16">
      <Page
        title="Companies"
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={logout}>Sign out</Button>
            <Button onClick={() => setCreateOpen(true)}>
              <IconPlus width={20} height={20} /> New
            </Button>
          </div>
        }
      >
        <div className="footnote text-secondary -mt-2">Signed in as {username}</div>

        {isLoading ? (
          <SkeletonRows count={5} />
        ) : data && data.length > 0 ? (
          <div className="inset-group">
            {data.map((c) => (
              <div key={c.id} className="list-row">
                <div className="min-w-0 flex-1">
                  <div className="subhead truncate" style={{ fontWeight: 600 }}>{c.name}</div>
                  <div className="footnote text-secondary truncate">
                    @{c.slug} · {c.customerCount} customers · {c.saleCount} sales · {money(c.totalSales, c.currencySymbol)}
                  </div>
                  <div className="footnote text-tertiary">Created {shortDate(c.createdAt)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="secondary" onClick={() => onReset(c)}>Reset password</Button>
                  <Button variant="ghost" onClick={() => onDelete(c)} aria-label="Delete">
                    <IconTrash width={20} height={20} style={{ color: 'var(--danger)' }} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <EmptyState
              title="No companies yet"
              subtitle="Create your first company account and hand the credentials to the owner."
              action={<Button onClick={() => setCreateOpen(true)}>Create company</Button>}
            />
          </div>
        )}
      </Page>

      {createOpen && (
        <CreateCompanyForm open={createOpen} onClose={() => setCreateOpen(false)} onCreated={setCredentials} />
      )}
      {credentials && <CredentialsModal data={credentials} onClose={() => setCredentials(null)} />}
    </div>
  )
}
