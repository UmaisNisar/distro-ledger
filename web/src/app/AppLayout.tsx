import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  IconCustomers,
  IconDashboard,
  IconReceivables,
  IconSales,
  IconSettings,
} from '../components/icons'

const NAV = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/sales', label: 'Sales', icon: IconSales, end: false },
  { to: '/customers', label: 'Customers', icon: IconCustomers, end: false },
  { to: '/receivables', label: 'Receivables', icon: IconReceivables, end: false },
  { to: '/settings', label: 'Settings', icon: IconSettings, end: false },
]

export function AppLayout() {
  const { company } = useAuth()

  return (
    <div className="min-h-full sm:flex">
      {/* Sidebar (desktop) */}
      <aside
        className="hidden sm:flex sm:flex-col shrink-0 w-60 p-4 gap-1"
        style={{ borderRight: '0.5px solid var(--separator)', position: 'sticky', top: 0, height: '100vh' }}
      >
        <div className="px-2 py-3">
          <div className="headline truncate">{company?.name}</div>
          <div className="footnote text-secondary truncate">@{company?.slug}</div>
        </div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className="nav-link">
            {({ isActive }) => (
              <span
                className="flex items-center gap-3 px-3 py-2.5 rounded-[10px]"
                style={{
                  background: isActive ? 'var(--fill)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--label)',
                  fontWeight: 600,
                }}
              >
                <n.icon width={22} height={22} />
                <span className="subhead" style={{ fontWeight: 600 }}>{n.label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-24 sm:pb-8">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom tab bar (mobile) */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 flex"
        style={{
          background: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '0.5px solid var(--separator)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className="flex-1">
            {({ isActive }) => (
              <span
                className="flex flex-col items-center gap-1 py-2"
                style={{ color: isActive ? 'var(--accent)' : 'var(--label-secondary)' }}
              >
                <n.icon width={24} height={24} />
                <span style={{ fontSize: 10, fontWeight: 600 }}>{n.label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
