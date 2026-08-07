import { NavLink } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import type { UserRole } from '@/types/database.types'

interface NavItem {
  to: string
  label: string
  emoji: string
  roles: UserRole[] // which roles can see this link
}

// Single source of truth for nav + access — matches the role matrix in the plan.
const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', emoji: '📊', roles: ['admin', 'manager', 'employee'] },
  { to: '/employees', label: 'Employees', emoji: '👥', roles: ['admin', 'manager'] },
  { to: '/departments', label: 'Departments', emoji: '🏢', roles: ['admin'] },
  { to: '/projects', label: 'Projects', emoji: '📁', roles: ['admin', 'manager', 'employee'] },
  { to: '/attendance', label: 'Attendance', emoji: '🕒', roles: ['admin', 'manager', 'employee'] },
  { to: '/leaves', label: 'Leave Management', emoji: '🌴', roles: ['admin', 'manager', 'employee'] },
  { to: '/payroll', label: 'Payroll', emoji: '💰', roles: ['admin', 'manager', 'employee'] },
  { to: '/audit-log', label: 'Audit Log', emoji: '📜', roles: ['admin'] },
  { to: '/settings', label: 'Settings', emoji: '⚙️', roles: ['admin', 'manager', 'employee'] },
]

export function Sidebar() {
  const { role, employee, signOut } = useAuth()

  // Only render links this employee's role is allowed to see —
  // unauthorized options never appear in the UI at all.
  const visibleItems = NAV_ITEMS.filter((item) => role && item.roles.includes(role))

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-chrome-border bg-chrome transition-colors">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="text-2xl">👨🏻‍🦱</span>
        <span className="text-lg font-semibold text-chrome-text">EMS</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-chrome-active text-chrome-text'
                  : 'text-chrome-muted hover:bg-chrome-hover hover:text-chrome-text'
              }`
            }
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-chrome-border px-4 py-4">
        <div className="mb-2 text-sm">
          <p className="font-medium text-chrome-text">
            {employee?.first_name} {employee?.last_name}
          </p>
          <p className="text-xs capitalize text-chrome-muted">{role}</p>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-chrome-muted hover:bg-chrome-hover hover:text-chrome-text"
        >
          <span>⬅️</span> Logout
        </button>
      </div>
    </aside>
  )
}