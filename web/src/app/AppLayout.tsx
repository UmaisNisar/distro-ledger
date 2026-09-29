import { LayoutDashboard, LogOut, Menu, Receipt, Settings, Users, Wallet } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ThemeToggle } from '../components/ThemeToggle'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/sales', label: 'Sales', icon: Receipt, end: false },
  { to: '/customers', label: 'Customers', icon: Users, end: false },
  { to: '/receivables', label: 'Receivables', icon: Wallet, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

export function AppLayout() {
  const { company, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const initial = company?.name?.[0]?.toUpperCase() ?? '·'

  const sidebar = (
    <aside className="w-64 min-h-full bg-base-100 border-r border-base-300 flex flex-col">
      <div className="flex items-center gap-2 px-5 h-16 shrink-0">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-content font-extrabold">
          D
        </span>
        <span className="font-bold text-lg tracking-tight">DistroLedger</span>
      </div>
      <nav className="flex flex-col gap-1 px-3 py-2 flex-1 overflow-y-auto">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setDrawerOpen(false)}>
            {({ isActive }) => (
              <span
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-content font-semibold shadow-sm'
                    : 'hover:bg-base-200 text-base-content/80'
                }`}
              >
                <n.icon size={20} className="shrink-0" />
                <span className="text-[0.95rem]">{n.label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-base-300 flex flex-col gap-1">
        <ThemeToggle />
        <div className="dropdown dropdown-top w-full">
          <div tabIndex={0} role="button" className="btn btn-ghost justify-start gap-3 w-full h-auto py-2">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-base-300 font-bold shrink-0">
              {initial}
            </span>
            <span className="text-left min-w-0 flex-1">
              <span className="block font-semibold truncate leading-tight">{company?.name}</span>
              <span className="block footnote text-secondary truncate">@{company?.slug}</span>
            </span>
          </div>
          <ul className="dropdown-content menu bg-base-100 rounded-box shadow-lg border border-base-300 w-full mb-2 z-50">
            <li>
              <button onClick={logout} className="text-error">
                <LogOut size={16} /> Sign out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="nav-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={drawerOpen}
        onChange={(e) => setDrawerOpen(e.target.checked)}
      />
      <div className="drawer-content flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 h-14 flex items-center gap-2 px-3 bg-base-100/90 backdrop-blur border-b border-base-300">
          <label htmlFor="nav-drawer" className="btn btn-ghost btn-square btn-sm">
            <Menu size={22} />
          </label>
          <span className="font-bold tracking-tight flex-1">DistroLedger</span>
          <ThemeToggle compact />
        </div>

        <main className="flex-1 w-full">
          <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <div className="drawer-side z-40">
        <label htmlFor="nav-drawer" aria-label="close sidebar" className="drawer-overlay" />
        {sidebar}
      </div>
    </div>
  )
}
