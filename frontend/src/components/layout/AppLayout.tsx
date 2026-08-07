import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/departments': 'Departments',
  '/projects': 'Projects',
  '/attendance': 'Attendance',
  '/leaves': 'Leave Management',
  '/payroll': 'Payroll',
  '/audit-log': 'Audit Log',
  '/settings': 'Settings',
}

export function AppLayout() {
  const location = useLocation()
  const title = TITLES[location.pathname] ?? 'EMS'

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
