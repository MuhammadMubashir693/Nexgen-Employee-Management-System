import { useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { useDepartments } from '@/lib/queries/useDepartments'
import { useEmployees } from '@/lib/queries/useEmployees'
import { useDeleteDepartment } from '@/lib/queries/useDepartmentMutations'
import { DepartmentFormModal } from './DepartmentFormModal'
import { pluralize } from '@/lib/utils'
import type { Department } from '@/types/database.types'

export function DepartmentsPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const { data: departments, isLoading } = useDepartments()
  const { data: employees } = useEmployees()
  const deleteDept = useDeleteDepartment()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Department | null>(null)

  // This page only routes to admins anyway (see router.tsx), but keep a
  // hard stop here too in case the component is ever reused elsewhere.
  if (!isAdmin) {
    return <p className="text-gray-500">🚫 This section is only available to admins.</p>
  }

  function employeeCount(deptId: number) {
    return employees?.filter((e) => e.department_id === deptId && e.status !== 'terminated').length ?? 0
  }

  function managerName(managerId: number | null) {
    const m = employees?.find((e) => e.employee_id === managerId)
    return m ? `${m.first_name} ${m.last_name}` : '—'
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-gray-500">🏢 Manage company departments and their managers.</p>
        <button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          ➕ Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-gray-400">⏳ Loading departments…</p>}

        {departments?.map((dept) => (
          <div
            key={dept.department_id}
            className="rounded-2xl border border-gray-200 bg-surface-alt p-5 dark:border-gray-800"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{dept.name}</h3>
                <p className="text-xs text-gray-400">📍 {dept.location ?? '—'}</p>
                <p className="text-xs text-gray-400">
                  💰 ${(dept.budget ?? 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
              <div className="flex gap-1">
                {/* ... action buttons ... */}
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              <p>🧭 Manager: {managerName(dept.manager_id)}</p>
              <p>👥 {pluralize(employeeCount(dept.department_id), 'employee')}</p>
            </div>
          </div>
        ))}
      </div>

      <DepartmentFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-xl dark:border-gray-800">
            <h3 className="mb-2 text-lg font-semibold">⚠️ Delete Department?</h3>
            <p className="mb-4 text-sm text-gray-500">
              Delete <strong>{confirmDelete.name}</strong>? Employees in this department will be
              unassigned, not deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteDept.mutateAsync(confirmDelete.department_id)
                  setConfirmDelete(null)
                }}
                disabled={deleteDept.isPending}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleteDept.isPending ? '⏳ Deleting…' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
