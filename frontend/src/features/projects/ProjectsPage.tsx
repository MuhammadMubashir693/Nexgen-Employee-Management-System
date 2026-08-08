import { useMemo, useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { useProjects, useDeleteProject } from '@/lib/queries/useProjects'
import { useDepartments } from '@/lib/queries/useDepartments'
import { Badge } from '@/components/ui/Badge'
import { ProjectFormModal } from './ProjectFormModal'
import { AssignmentModal } from './AssignmentModal'
import type { ProjectWithRelations } from '@/types/database.types'

export function ProjectsPage() {
  const { role, employee } = useAuth()
  const isAdmin = role === 'admin'
  const isManager = role === 'manager'

  const { data: projects, isLoading } = useProjects()
  const { data: departments } = useDepartments()
  const deleteProject = useDeleteProject()

  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectWithRelations | null>(null)
  const [teamProject, setTeamProject] = useState<ProjectWithRelations | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ProjectWithRelations | null>(null)

  // A manager can only manage (edit/delete/assign) projects in their own
  // department — admin can manage any. Employees never get management
  // controls; RLS is still the real boundary, this is just UX.
  function canManage(p: ProjectWithRelations) {
    if (isAdmin) return true
    if (isManager) return p.department_id === employee?.department_id
    return false
  }

  const canCreate = isAdmin || isManager

  const filtered = useMemo(() => {
    if (!projects) return []
    return projects.filter((p) => {
      const matchesDept = departmentFilter === 'all' || String(p.department_id) === departmentFilter
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesDept && matchesStatus
    })
  }, [projects, departmentFilter, statusFilter])

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(p: ProjectWithRelations) {
    setEditing(p)
    setModalOpen(true)
  }

  function formatDate(d: string | null) {
    return d ?? '—'
  }

  function formatBudget(b: number | null) {
    if (b == null) return '—'
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(b)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="all">All Statuses</option>
            <option value="active">✅ Active</option>
            <option value="on_hold">⏸️ On Hold</option>
            <option value="completed">🏁 Completed</option>
            <option value="cancelled">🚫 Cancelled</option>
          </select>
        </div>

        {canCreate && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            ➕ Add Project
          </button>
        )}
      </div>

      {isLoading && <p className="text-gray-400">⏳ Loading projects…</p>}

      {!isLoading && filtered.length === 0 && (
        <p className="text-gray-400">🕵️ No projects match your filters.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const manageable = canManage(p)
          return (
            <div
              key={p.project_id}
              className="flex flex-col rounded-2xl border border-gray-200 bg-surface-alt p-5 dark:border-gray-800"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{p.project_name}</h3>
                  <p className="text-xs text-gray-400">🏢 {p.department?.name ?? '—'}</p>
                </div>
                <Badge value={p.status} />
              </div>

              <div className="mb-4 space-y-1 text-sm text-gray-500">
                <p>
                  🧭 Manager: {p.manager ? `${p.manager.first_name} ${p.manager.last_name}` : '—'}
                </p>
                <p>
                  📅 {formatDate(p.start_date)} → {formatDate(p.end_date)}
                </p>
                <p>💵 {formatBudget(p.budget)}</p>
                <p>
                  👥 {p.assignments.length} assigned
                  {p.assignments.length > 0 && (
                    <span className="text-gray-400">
                      {' '}
                      — {p.assignments
                        .slice(0, 3)
                        .map((a) => a.employee.first_name)
                        .join(', ')}
                      {p.assignments.length > 3 ? `, +${p.assignments.length - 3} more` : ''}
                    </span>
                  )}
                </p>
              </div>

              <div className="mt-auto flex justify-end gap-2">
                <button
                  onClick={() => setTeamProject(p)}
                  className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Manage team"
                >
                  👥
                </button>
                {manageable && (
                  <>
                    <button
                      onClick={() => openEdit(p)}
                      title="Edit"
                      className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p)}
                      title="Delete"
                      className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {canCreate && (
        <ProjectFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
      )}

      <AssignmentModal
        open={!!teamProject}
        onClose={() => setTeamProject(null)}
        project={teamProject}
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-xl dark:border-gray-800">
            <h3 className="mb-2 text-lg font-semibold">⚠️ Delete Project?</h3>
            <p className="mb-4 text-sm text-gray-500">
              Delete <strong>{confirmDelete.project_name}</strong>? All assignments for this project
              will also be removed.
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
                  await deleteProject.mutateAsync(confirmDelete.project_id)
                  setConfirmDelete(null)
                }}
                disabled={deleteProject.isPending}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleteProject.isPending ? '⏳ Deleting…' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
