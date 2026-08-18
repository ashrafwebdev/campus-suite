import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

interface NavItem {
  to: string
  label: string
  enabled: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', enabled: true },
  { to: '/admissions', label: 'Admissions', enabled: true },
  { to: '/students', label: 'Students', enabled: true },
  { to: '/academic', label: 'Academic', enabled: true },
  { to: '/hostel', label: 'Hostel', enabled: true },
  { to: '/fees', label: 'Fees & Finance', enabled: true },
  { to: '/library', label: 'Library', enabled: true },
  { to: '/transport', label: 'Transport', enabled: true },
  { to: '/exams', label: 'Exams & Results', enabled: true },
  { to: '/certificates', label: 'Certificates', enabled: true },
  { to: '/hr', label: 'HR & Payroll', enabled: true },
]

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <span className="text-lg font-semibold tracking-tight">Campus Suite</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) =>
            item.enabled ? (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ) : (
              <div
                key={item.to}
                title="Coming soon"
                className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-400"
              >
                <span>{item.label}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Soon
                </span>
              </div>
            ),
          )}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-2 truncate text-sm font-medium text-slate-700">{user?.name}</div>
          <div className="mb-3 truncate text-xs text-slate-400">{user?.email}</div>
          <button
            onClick={logout}
            className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
