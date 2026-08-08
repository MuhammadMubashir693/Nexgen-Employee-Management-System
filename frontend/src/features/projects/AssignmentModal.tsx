import { useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useEmployees } from '@/lib/queries/useEmployees'
import { useAssignEmployee, useUnassignEmployee } from '@/lib/queries/useProjects'
import type { ProjectWithRelations } from '@/types/database.types'

export function AssignmentModal({
  open,
  onClose,
  project,
}: {
  open: boolean
  onClose: () => void
  project: ProjectWithRelations | null
}) {
  const { data: employees } = useEmployees()
  const assign = useAssignEmployee()
  const unassign = useUnassignEmployee()

  const [employeeId, setEmployeeId] = useState<string>('')
  const [assignedRole, setAssignedRole] = useState('')
  const [error, setError] = useState<string | null>(null)

  const assignedIds = useMemo(
    () => new Set(project?.assignments.map((a) => a.employee_id) ?? []),
    [project]
  )

  // Only offer active employees in this project's department who aren't
  // already on the roster.
  const available = useMemo(() => {
    if (!employees || !project) return []
    return employees.filter(
      (e) =>
        e.status !== 'terminated' &&
        !assignedIds.has(e.employee_id) &&
        (!project.department_id || e.department_id === project.department_id)
    )
  }, [employees, project, assignedIds])

  if (!project) return null

  async function handleAssign() {
    setError(null)
    if (!employeeId) return
    try {
      await assign.mutateAsync({
        project_id: project!.project_id,
        employee_id: Number(employeeId),
        assigned_role: assignedRole || null,
      })
      setEmployeeId('')
      setAssignedRole('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleUnassign(employee_id: number) {
    setError(null)
    try {
      await unassign.mutateAsync({ project_id: project!.project_id, employee_id })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`👥 Team — ${project.project_name}`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="">— Select —</option>
              {available.map((e) => (
                <option key={e.employee_id} value={e.employee_id}>
                  {e.first_name} {e.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Role on project</label>
            <input
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value)}
              placeholder="e.g. Contributor"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <button
            onClick={handleAssign}
            disabled={!employeeId || assign.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {assign.isPending ? '⏳' : '➕ Add'}
          </button>
        </div>

        {available.length === 0 && (
          <p className="text-xs text-gray-400">
            No more eligible employees to add{project.department_id ? ' from this department' : ''}.
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30">
            ⚠️ {error}
          </p>
        )}

        <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800">
          {project.assignments.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-400">
              🕵️ No one is assigned to this project yet.
            </p>
          )}
          {project.assignments.map((a) => (
            <div
              key={a.employee_id}
              className="flex items-center justify-between border-b border-gray-100 px-4 py-2 text-sm last:border-b-0 dark:border-gray-800"
            >
              <div>
                <span className="font-medium">
                  {a.employee.first_name} {a.employee.last_name}
                </span>
                {a.assigned_role && (
                  <span className="ml-2 text-xs text-gray-400">{a.assigned_role}</span>
                )}
              </div>
              <button
                onClick={() => handleUnassign(a.employee_id)}
                disabled={unassign.isPending}
                title="Remove from project"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
              >
                ✖️
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
