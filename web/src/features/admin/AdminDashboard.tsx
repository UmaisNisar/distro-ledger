import { Building2, KeyRound, LogOut, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useAdmin } from '../../auth/AdminContext'
import { ThemeToggle } from '../../components/ThemeToggle'
import { Button, EmptyState, SkeletonRows } from '../../components/ui'
import { useCompanies, useDeleteCompany, useResetPassword } from '../../lib/adminQueries'
import { money, shortDate } from '../../lib/format'
import { notify } from '../../lib/toast'
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
      notify.success('New password generated')
    } catch (e) {
      notify.fromError(e)
    }
  }

  const onDelete = async (c: CompanyAdmin) => {
    if (!confirm(`Delete ${c.name}? This permanently removes all their data.`)) return
    try {
      await del.mutateAsync(c.id)
      notify.success(`${c.name} deleted`)
    } catch (e) {
      notify.fromError(e)
    }
  }

  return (
    <div className="min-h-screen bg-base-200">
      <header className="sticky top-0 z-20 h-16 bg-base-100 border-b border-base-300 flex items-center gap-3 px-4 sm:px-8">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-content font-extrabold">D</span>
        <div className="flex-1">
          <div className="font-bold tracking-tight leading-tight">Admin Console</div>
          <div className="footnote text-secondary">Signed in as {username}</div>
        </div>
        <ThemeToggle compact />
        <Button variant="ghost" onClick={logout}><LogOut size={18} /> Sign out</Button>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 sm:px-8 py-8 animate-page">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="large-title">Companies</h1>
            <p className="subhead text-secondary mt-0.5">{data ? `${data.length} account${data.length === 1 ? '' : 's'}` : 'Manage company accounts'}</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}><Plus size={18} /> New company</Button>
        </div>

        {isLoading ? (
          <SkeletonRows count={5} />
        ) : data && data.length > 0 ? (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th className="text-right">Customers</th>
                    <th className="text-right">Sales</th>
                    <th className="text-right">Total</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((c) => (
                    <tr key={c.id} className="hover:bg-base-200 transition-colors">
                      <td>
                        <div className="font-semibold">{c.name}</div>
                        <div className="footnote text-secondary">@{c.slug}</div>
                      </td>
                      <td className="text-right tabular">{c.customerCount}</td>
                      <td className="text-right tabular">{c.saleCount}</td>
                      <td className="text-right tabular font-semibold">{money(c.totalSales, c.currencySymbol)}</td>
                      <td className="text-secondary whitespace-nowrap">{shortDate(c.createdAt)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button className="btn btn-ghost btn-sm gap-1" onClick={() => onReset(c)}>
                            <KeyRound size={15} /> Reset
                          </button>
                          <button className="btn btn-ghost btn-sm btn-square text-error" onClick={() => onDelete(c)} aria-label="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="panel">
            <EmptyState
              icon={Building2}
              title="No companies yet"
              subtitle="Create your first company account and hand the credentials to the owner."
              action={<Button onClick={() => setCreateOpen(true)}><Plus size={18} /> Create company</Button>}
            />
          </div>
        )}
      </main>

      {createOpen && <CreateCompanyForm open={createOpen} onClose={() => setCreateOpen(false)} onCreated={setCredentials} />}
      {credentials && <CredentialsModal data={credentials} onClose={() => setCredentials(null)} />}
    </div>
  )
}
