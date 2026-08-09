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

/** Returns the user's initials (up to 2 characters) for the avatar fallback. */
function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0]?.toUpperCase() ?? ''
  const l = lastName?.[0]?.toUpperCase() ?? ''
  return f + l || '?'
}

/** Deterministic background color from initials, for the fallback avatar. */
function getAvatarColor(initials: string): string {
  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-pink-500',
  ]
  const idx = (initials.charCodeAt(0) || 0) % colors.length
  return colors[idx]
}

export function Sidebar() {
  const { role, employee, signOut } = useAuth()

  // Only render links this employee's role is allowed to see —
  // unauthorized options never appear in the UI at all.
  const visibleItems = NAV_ITEMS.filter((item) => role && item.roles.includes(role))

  const initials = getInitials(employee?.first_name, employee?.last_name)
  const avatarColor = getAvatarColor(initials)

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
        <div className="mb-2 flex items-center gap-3">
          {/* Avatar circle — shows profile picture or initials fallback */}
          <div className="relative flex-shrink-0">
            {employee?.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt={`${employee.first_name} ${employee.last_name}`}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-chrome-border"
              />
            ) : (
              <div
                className={`h-9 w-9 rounded-full ${avatarColor} flex items-center justify-center ring-2 ring-chrome-border`}
              >
                <span className="text-xs font-bold text-white leading-none">{initials}</span>
              </div>
            )}
          </div>

          {/* Name & role */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-chrome-text text-sm">
              {employee?.first_name} {employee?.last_name}
            </p>
            <p className="text-xs capitalize text-chrome-muted">{role}</p>
          </div>
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
