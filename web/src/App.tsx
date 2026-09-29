import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './app/AppLayout'
import { useAuth } from './auth/AuthContext'
import { Spinner } from './components/ui'
import { CustomerDetailPage } from './features/customers/CustomerDetailPage'
import { CustomersPage } from './features/customers/CustomersPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { InvoicePage } from './features/invoice/InvoicePage'
import { LoginPage } from './features/auth/LoginPage'
import { OnboardingPage } from './features/onboarding/OnboardingPage'
import { ReceivablesPage } from './features/receivables/ReceivablesPage'
import { SalesPage } from './features/sales/SalesPage'
import { SettingsPage } from './features/settings/SettingsPage'
import type { ReactNode } from 'react'

function Splash() {
  return (
    <div className="min-h-full flex items-center justify-center" style={{ color: 'var(--accent)' }}>
      <Spinner />
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { company, ready } = useAuth()
  if (!ready) return <Splash />
  if (!company) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { company, ready } = useAuth()
  if (!ready) return <Splash />
  if (company) return <Navigate to="/" replace />
  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/onboarding" element={<PublicOnly><OnboardingPage /></PublicOnly>} />

      {/* Printable invoice (authed, no app chrome) */}
      <Route path="/invoice/:id" element={<RequireAuth><InvoicePage /></RequireAuth>} />

      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/receivables" element={<ReceivablesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
