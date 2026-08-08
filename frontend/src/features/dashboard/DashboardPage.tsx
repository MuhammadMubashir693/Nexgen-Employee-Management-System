import { useAuth } from '@/auth/AuthProvider'
import { useEmployees } from '@/lib/queries/useEmployees'
import { useDepartments } from '@/lib/queries/useDepartments'
import { useProjects } from '@/lib/queries/useProjects'

export function DashboardPage() {
  const { employee, role } = useAuth()
  const { data: employees, isLoading: loadingEmployees } = useEmployees()
  const { data: departments, isLoading: loadingDepartments } = useDepartments()
  const { data: projects, isLoading: loadingProjects } = useProjects()

  const isLoading = loadingEmployees || loadingDepartments || loadingProjects

  const totalEmployees = employees ? employees.filter((e) => e.status !== 'terminated').length : 0
  const onLeaveCount = employees ? employees.filter((e) => e.status === 'on_leave').length : 0
  const totalDepartments = departments ? departments.length : 0
  const activeProjects = projects ? projects.filter((p) => p.status === 'active').length : 0

  return (
    <div>
      <p className="mb-6 text-gray-500">
        👋 Welcome back, <strong className="text-gray-900 dark:text-gray-100">{employee?.first_name} {employee?.last_name}</strong>. Here's your <span className="capitalize font-medium">{role}</span> overview.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard emoji="👥" label="Total Employees" value={isLoading ? '…' : totalEmployees} />
        <StatCard emoji="🌴" label="On Leave Today" value={isLoading ? '…' : onLeaveCount} />
        <StatCard emoji="🏢" label="Departments" value={isLoading ? '…' : totalDepartments} />
        <StatCard emoji="📁" label="Active Projects" value={isLoading ? '…' : activeProjects} />
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-surface-alt p-6 dark:border-gray-800">
        <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">📌 Quick System Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="font-medium text-gray-900 dark:text-gray-200">Active Workforce</p>
            <p className="mt-1 text-2xl font-bold text-primary">{totalEmployees}</p>
            <p className="mt-1 text-xs text-gray-400">Currently active staff</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="font-medium text-gray-900 dark:text-gray-200">Department Count</p>
            <p className="mt-1 text-2xl font-bold text-emerald-500">{totalDepartments}</p>
            <p className="mt-1 text-xs text-gray-400">Active departments</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="font-medium text-gray-900 dark:text-gray-200">Project Operations</p>
            <p className="mt-1 text-2xl font-bold text-blue-500">{activeProjects}</p>
            <p className="mt-1 text-xs text-gray-400">Ongoing active projects</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-surface-alt p-5 dark:border-gray-800">
      <div className="mb-2 text-2xl">{emoji}</div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  )
}

