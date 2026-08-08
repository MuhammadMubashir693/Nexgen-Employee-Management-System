import { useMemo, useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { useEmployees, useDeactivateEmployee } from '@/lib/queries/useEmployees'
import { useDepartments } from '@/lib/queries/useDepartments'
import { Badge } from '@/components/ui/Badge'
import { EmployeeFormModal } from './EmployeeFormModal'
import type { EmployeeWithDepartment } from '@/types/database.types'

export function EmployeesPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const { data: employees, isLoading } = useEmployees()
  const { data: departments } = useDepartments()
  const deactivate = useDeactivateEmployee()

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmployeeWithDepartment | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState<EmployeeWithDepartment | null>(null)

  const filtered = useMemo(() => {
    if (!employees) return []
    return employees.filter((e) => {
      const matchesSearch =
        !search ||
        `${e.first_name} ${e.last_name} ${e.email}`.toLowerCase().includes(search.toLowerCase())
      const matchesDept =
        departmentFilter === 'all' || String(e.department_id) === departmentFilter
      const matchesRole = roleFilter === 'all' || e.role === roleFilter
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter
      return matchesSearch && matchesDept && matchesRole && matchesStatus
    })
  }, [employees, search, departmentFilter, roleFilter, statusFilter])

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(emp: EmployeeWithDepartment) {
    setEditing(emp)
    setModalOpen(true)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="all">🏢 All Departments</option>
            {departments?.map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="all">🧭 All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="all">All Statuses</option>
            <option value="active">✅ Active</option>
            <option value="on_leave">🌴 On Leave</option>
            <option value="terminated">⛔ Terminated</option>
          </select>
        </div>

        {/* Add Employee button only rendered for admin — not just disabled */}
        {isAdmin && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            ➕ Add Employee
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Job Title</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Hire Date</th>
              {isAdmin && <th className="px-4 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  ⏳ Loading employees…
                </td>
              </tr>
            )}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  🕵️ No employees match your filters.
                </td>
              </tr>
            )}

            {filtered.map((emp) => (
              <tr
                key={emp.employee_id}
                className="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/40"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {emp.first_name} {emp.last_name}
                  </div>
                  <div className="text-xs text-gray-400">{emp.email}</div>
                </td>
                <td className="px-4 py-3">{emp.department?.name ?? '—'}</td>
                <td className="px-4 py-3">{emp.job_title ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge value={emp.role} />
                </td>
                <td className="px-4 py-3">
                  <Badge value={emp.status} />
                </td>
                <td className="px-4 py-3">{emp.hire_date}</td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(emp)}
                        title="Edit"
                        className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        ✏️
                      </button>
                      {emp.status !== 'terminated' && emp.role === 'manager' && (
                        <button
                          onClick={() => setConfirmDeactivate(emp)}
                          title="Deactivate"
                          className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <EmployeeFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editing={editing}
        />
      )}

      {isAdmin && confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-xl dark:border-gray-800">
            <h3 className="mb-2 text-lg font-semibold">⚠️ Deactivate Employee?</h3>
            <p className="mb-4 text-sm text-gray-500">
              This will mark <strong>{confirmDeactivate.first_name} {confirmDeactivate.last_name}</strong> as
              terminated and disable their login. Their records (payroll, leave, attendance) are kept for history.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deactivate.mutateAsync(confirmDeactivate.employee_id)
                  setConfirmDeactivate(null)
                }}
                disabled={deactivate.isPending}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deactivate.isPending ? '⏳ Working…' : '🗑️ Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
