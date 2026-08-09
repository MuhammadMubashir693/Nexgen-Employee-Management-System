import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/auth/AuthProvider'
import { useDepartments } from '@/lib/queries/useDepartments'
import { useEmployees } from '@/lib/queries/useEmployees'
import { useCreateProject, useUpdateProject } from '@/lib/queries/useProjects'
import type { ProjectWithRelations } from '@/types/database.types'

const schema = z
  .object({
    project_name: z.string().min(2, 'Project name must be at least 2 characters'),
    department_id: z.preprocess(
      (val) => (val === '' || val === undefined || val === null || val === '0' || Number.isNaN(Number(val)) ? null : Number(val)),
      z.number().nullable().optional()
    ),
    manager_id: z.preprocess(
      (val) => (val === '' || val === undefined || val === null || val === '0' || Number.isNaN(Number(val)) ? null : Number(val)),
      z.number().nullable().optional()
    ),
    start_date: z.string().optional().or(z.literal('')),
    end_date: z.string().optional().or(z.literal('')),
    budget: z.coerce.number().nonnegative('Budget must be 0 or more').optional().nullable(),
    status: z.enum(['active', 'completed', 'on_hold', 'cancelled']),
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
    message: 'End date must be on or after the start date',
    path: ['end_date'],
  })
type FormValues = z.infer<typeof schema>

export function ProjectFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: ProjectWithRelations | null
}) {
  const { role, employee } = useAuth()
  const isAdmin = role === 'admin'

  const { data: departments } = useDepartments()
  const { data: employees } = useEmployees()

  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const watchedDepartmentId = useWatch({ control, name: 'department_id' })
  // register('department_id') gives the raw <select> value as a string;
  // coerce it before comparing against employee.department_id (a number).
  const watchedDepartmentIdNum =
    watchedDepartmentId == null ? null : Number(watchedDepartmentId)

  // Only non-terminated managers from the selected department can be
  // picked as the project manager. Employees, admins, and managers from
  // other departments are never selectable.
  const eligibleManagers = useMemo(() => {
    if (!employees || !watchedDepartmentIdNum) return []

    return employees.filter(
      (e) =>
        e.status !== 'terminated' &&
        e.role === 'manager' &&
        e.department_id === watchedDepartmentIdNum
    )
  }, [employees, watchedDepartmentIdNum])

  // Tracks the department the manager_id field was last valid for, so we
  // only clear the selection when the department *changes* — not on the
  // initial populate/reset when the modal opens.
  const lastSyncedDeptRef = useRef<number | null | undefined>(undefined)
  useEffect(() => {
    if (
      lastSyncedDeptRef.current !== undefined &&
      lastSyncedDeptRef.current !== watchedDepartmentIdNum
    ) {
      setValue('manager_id', null, { shouldValidate: true })
    }
    lastSyncedDeptRef.current = watchedDepartmentIdNum
  }, [watchedDepartmentIdNum, setValue])

  // Re-populate whenever a different project opens for edit, or the modal
  // re-opens fresh for "Add" — modal stays mounted between opens.
  useEffect(() => {
    if (open) {
      const initial = editing
        ? {
          project_name: editing.project_name,
          department_id: editing.department_id ?? null,
          manager_id: editing.manager_id ?? null,
          start_date: editing.start_date ?? '',
          end_date: editing.end_date ?? '',
          budget: editing.budget ?? undefined,
          status: editing.status,
        }
        : {
          project_name: '',
          // Managers can only create projects in their own department.
          department_id: isAdmin ? null : employee?.department_id ?? null,
          manager_id: isAdmin ? null : employee?.employee_id ?? null,
          start_date: '',
          end_date: '',
          budget: undefined,
          status: 'active' as const,
        }
      reset(initial)
      // Sync so the manager-clearing effect doesn't fire from this reset.
      lastSyncedDeptRef.current = initial.department_id ?? null
    }
  }, [open, editing, reset, isAdmin, employee])

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      const payload = {
        project_name: values.project_name,
        department_id: values.department_id ?? null,
        manager_id: values.manager_id ?? null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        budget: values.budget ?? null,
        status: values.status,
      }
      if (editing) {
        await updateProject.mutateAsync({ project_id: editing.project_id, ...payload })
      } else {
        await createProject.mutateAsync(payload)
      }
      reset()
      onClose()
    } catch (err) {
      setServerError((err as Error).message)
    }
  }

  const busy = createProject.isPending || updateProject.isPending

  function inputClass(hasError: boolean) {
    return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${hasError
      ? 'border-red-400 bg-red-50 text-gray-400 dark:bg-red-950/30'
      : 'border-gray-300 bg-white focus:border-primary dark:border-gray-700 dark:bg-gray-900'
      }`
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? '✏️ Edit Project' : '➕ Add Project'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">📁 Project Name</label>
          <input {...register('project_name')} className={inputClass(!!errors.project_name)} />
          {errors.project_name && (
            <p className="mt-1 text-xs text-red-500">{errors.project_name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">🏢 Department</label>
            <select
              {...register('department_id')}
              disabled={!isAdmin}
              className={`${inputClass(false)} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <option value="">— None —</option>
              {departments?.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">🧭 Project Manager</label>
            <select
              {...register('manager_id')}
              disabled={!watchedDepartmentIdNum}
              className={`${inputClass(false)} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <option value="">
                {watchedDepartmentIdNum ? '— Select manager —' : '— Select department first —'}
              </option>
              {eligibleManagers.map((m) => (
                <option key={m.employee_id} value={m.employee_id}>
                  {m.first_name} {m.last_name}
                </option>
              ))}
            </select>
            {watchedDepartmentIdNum && eligibleManagers.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">
                No eligible managers in this department yet.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">📅 Start Date</label>
            <input type="date" {...register('start_date')} className={inputClass(!!errors.start_date)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">📅 End Date</label>
            <input type="date" {...register('end_date')} className={inputClass(!!errors.end_date)} />
            {errors.end_date && (
              <p className="mt-1 text-xs text-red-500">{errors.end_date.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">💵 Budget</label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('budget')}
              className={inputClass(!!errors.budget)}
            />
            {errors.budget && <p className="mt-1 text-xs text-red-500">{errors.budget.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">📊 Status</label>
            <select {...register('status')} className={inputClass(!!errors.status)}>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30">
            ⚠️ {serverError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || busy}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? '⏳ Saving…' : editing ? '💾 Save Changes' : '✅ Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
