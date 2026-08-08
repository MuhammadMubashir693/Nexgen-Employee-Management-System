import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useEmployees } from '@/lib/queries/useEmployees'
import { useCreateDepartment, useUpdateDepartment } from '@/lib/queries/useDepartmentMutations'
import type { Department } from '@/types/database.types'

const schema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  location: z.string().min(1, 'Location is required'),
  manager_id: z.preprocess(
    (val) => (val === '' || val === undefined || val === null || val === '0' || Number.isNaN(Number(val)) ? null : Number(val)),
    z.number().nullable().optional()
  ),
})
type FormValues = z.infer<typeof schema>

export function DepartmentFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Department | null
}) {
  const { data: employees } = useEmployees()
  const managers = employees?.filter((e) => e.role === 'manager' && e.status !== 'terminated') ?? []

  const createDept = useCreateDepartment()
  const updateDept = useUpdateDepartment()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  // Re-populate the form whenever a different department is opened for
  // editing (or the modal is opened fresh for "Add"). defaultValues alone
  // won't do this since the modal component stays mounted between opens.
  useEffect(() => {
    if (open) {
      reset(
        editing
          ? { name: editing.name, location: editing.location ?? '', manager_id: editing.manager_id ?? null }
          : { name: '', location: '', manager_id: null }
      )
    }
  }, [open, editing, reset])

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const payload = {
      name: values.name,
      location: values.location,
      manager_id: values.manager_id ?? null,
    }
    try {
      if (editing) {
        await updateDept.mutateAsync({ department_id: editing.department_id, ...payload })
      } else {
        await createDept.mutateAsync(payload)
      }
      reset()
      onClose()
    } catch (err) {
      setServerError((err as Error).message)
    }
  }

  const busy = createDept.isPending || updateDept.isPending

  function inputClass(hasError: boolean) {
    return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
      hasError
        ? 'border-red-400 bg-red-50 text-gray-400 dark:bg-red-950/30'
        : 'border-gray-300 bg-white focus:border-primary dark:border-gray-700 dark:bg-gray-900'
    }`
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? '✏️ Edit Department' : '➕ Add Department'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">🏢 Department Name</label>
          <input {...register('name')} className={inputClass(!!errors.name)} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">📍 Location</label>
          <input {...register('location')} className={inputClass(!!errors.location)} />
          {errors.location && (
            <p className="mt-1 text-xs text-red-500">{errors.location.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">🧭 Department Manager</label>
          <select {...register('manager_id')} className={inputClass(false)}>
            <option value="">— None —</option>
            {managers.map((m) => (
              <option key={m.employee_id} value={m.employee_id}>
                {m.first_name} {m.last_name}
              </option>
            ))}
          </select>
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
            {busy ? '⏳ Saving…' : editing ? '💾 Save Changes' : '✅ Create Department'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
