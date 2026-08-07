import { useAuth } from '@/auth/AuthProvider'

export function DashboardPage() {
  const { employee, role } = useAuth()

  return (
    <div>
      <p className="mb-6 text-gray-500">
        👋 Welcome back, {employee?.first_name}. Here's your {role} overview.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardPlaceholder emoji="👥" label="Total Employees" />
        <StatCardPlaceholder emoji="🌴" label="On Leave Today" />
        <StatCardPlaceholder emoji="🏢" label="Departments" />
        <StatCardPlaceholder emoji="📝" label="Pending Approvals" />
      </div>

      <p className="mt-8 text-sm text-gray-400">
        📊 Real stats connect in Phase 3 (Dashboard data + RPC functions).
      </p>
    </div>
  )
}

function StatCardPlaceholder({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-surface-alt p-5 dark:border-gray-800">
      <div className="mb-2 text-2xl">{emoji}</div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">—</p>
    </div>
  )
}
