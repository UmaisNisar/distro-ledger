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
    <aside className="w-64 min-h-full flex flex-col bg-[#16201B] text-[#F5F3EE] [&_.btn]:text-[#F5F3EE]">
      <div className="flex items-center gap-3 px-5 h-16 shrink-0">
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary text-primary-content font-extrabold text-lg"
          style={{ fontFamily: 'var(--font-display)' }}>
          {initial}
        </span>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="font-bold truncate" style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
            {company?.name ?? 'DistroLedger'}
          </span>
          <span className="text-[0.72rem] text-[#B9C3BD] truncate">@{company?.slug ?? 'workspace'}</span>
        </div>
      </div>
      <nav className="flex flex-col gap-1 px-3 py-3 flex-1 overflow-y-auto">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setDrawerOpen(false)}>
            {({ isActive }) => (
              <span
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-white/[0.09] text-white font-semibold'
                    : 'text-[#B9C3BD] hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <n.icon size={20} className="shrink-0" />
                <span className="text-[0.95rem]">{n.label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 flex flex-col gap-1 border-t border-white/10">
        <ThemeToggle />
        <div className="dropdown dropdown-top w-full">
          <div tabIndex={0} role="button" className="btn btn-ghost justify-start gap-3 w-full h-auto py-2 hover:bg-white/[0.06]">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-white/10 font-bold shrink-0">
              {initial}
            </span>
            <span className="text-left min-w-0 flex-1">
              <span className="block font-semibold truncate leading-tight">{company?.name}</span>
              <span className="block text-[0.72rem] text-[#B9C3BD] truncate">@{company?.slug}</span>
            </span>
          </div>
          <ul className="dropdown-content menu bg-base-100 text-base-content rounded-box shadow-lg border border-base-300 w-full mb-2 z-50">
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
          <span className="font-bold flex-1 truncate" style={{ fontFamily: 'var(--font-display)' }}>
            {company?.name ?? 'DistroLedger'}
          </span>
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
