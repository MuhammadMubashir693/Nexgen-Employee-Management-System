import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { useDepartments } from '@/lib/queries/useDepartments'
import {
  useCreateEmployee,
  useUpdateEmployee,
  type CreateEmployeeInput,
} from '@/lib/queries/useEmployees'
import type { EmployeeWithDepartment } from '@/types/database.types'
import { useEffect, useState } from 'react'

const baseSchema = {
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  gender: z.enum(['M', 'F']).optional().nullable(),
  department_id: z.preprocess(
    (val) => (val === '' || val === undefined || val === null || val === '0' || Number.isNaN(Number(val)) ? null : Number(val)),
    z.number().nullable().optional()
  ),
  job_title: z.string().min(1, 'Job title is required'),
  hire_date: z.string().min(1, 'Hire date is required'),
  role: z.enum(['admin', 'manager', 'employee']),
}

const createSchema = z.object({
  ...baseSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
})

const editSchema = z.object(baseSchema)

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

export function EmployeeFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: EmployeeWithDepartment | null
}) {
  const { data: departments } = useDepartments()
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEdit = !!editing
  const schema = isEdit ? editSchema : createSchema

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<CreateForm | EditForm>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const selectedRole = watch('role')

  useEffect(() => {
    if (selectedRole === 'admin') {
      setValue('department_id', null)
    }
  }, [selectedRole, setValue])

  // Re-populate whenever a different employee is opened for edit, or the
  // modal re-opens fresh for "Add" — defaultValues alone won't do this
  // because the modal stays mounted between opens.
  useEffect(() => {
    if (open) {
      reset(
        editing
          ? {
              first_name: editing.first_name,
              last_name: editing.last_name,
              email: editing.email,
              gender: editing.gender ?? undefined,
              department_id: editing.role === 'admin' ? null : (editing.department_id ?? null),
              job_title: editing.job_title ?? '',
              hire_date: editing.hire_date,
              role: editing.role,
            }
          : ({
              first_name: '',
              last_name: '',
              email: '',
              job_title: '',
              hire_date: '',
              role: 'employee',
              department_id: null,
              password: '',
            } as CreateForm)
      )
    }
  }, [open, editing, reset])

  async function onSubmit(values: CreateForm | EditForm) {
    setServerError(null)
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      gender: values.gender ?? null,
      department_id: values.role === 'admin' ? null : (values.department_id ?? null),
      job_title: values.job_title,
      hire_date: values.hire_date,
      role: values.role,
    }
    try {
      if (isEdit && editing) {
        await updateEmployee.mutateAsync({
          employee_id: editing.employee_id,
          ...payload,
        })
      } else {
        await createEmployee.mutateAsync({
          ...(values as CreateEmployeeInput),
          ...payload,
        })
      }
      reset()
      onClose()
    } catch (err) {
      setServerError((err as Error).message)
    }
  }

  const busy = createEmployee.isPending || updateEmployee.isPending

  function inputClass(hasError: boolean) {
    return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
      hasError
        ? 'border-red-400 bg-red-50 text-gray-400 dark:bg-red-950/30'
        : 'border-gray-300 bg-white focus:border-primary dark:border-gray-700 dark:bg-gray-900'
    }`
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? '✏️ Edit Employee' : '➕ Add Employee'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">First Name</label>
            <input
              {...register('first_name')}
              className={inputClass(!!errors.first_name)}
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Last Name</label>
            <input
              {...register('last_name')}
              className={inputClass(!!errors.last_name)}
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">📧 Email</label>
          <input
            {...register('email')}
            className={inputClass(!!errors.email)}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {!isEdit && (
          <div>
            <label className="mb-1 block text-sm font-medium">🔒 Temporary Password</label>
            <input
              type="password"
              {...register('password')}
              className={inputClass(!!(errors as any).password)}
            />
            {(errors as any).password && (
              <p className="mt-1 text-xs text-red-500">{(errors as any).password.message}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">🏢 Department</label>
            <select
              {...register('department_id')}
              disabled={selectedRole === 'admin'}
              className={`${inputClass(false)} ${selectedRole === 'admin' ? 'bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed' : ''}`}
            >
              <option value="">— None —</option>
              {departments?.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.name}
                </option>
              ))}
            </select>
            {selectedRole === 'admin' && (
              <p className="mt-1 text-xs text-gray-400">Admins do not belong to departments.</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">🧭 Role</label>
            <select {...register('role')} className={inputClass(!!errors.role)}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">⚧ Gender</label>
          <select {...register('gender')} className={inputClass(!!errors.gender)}>
            <option value="">— Unspecified —</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">💼 Job Title</label>
            <input {...register('job_title')} className={inputClass(!!errors.job_title)} />
            {errors.job_title && (
              <p className="mt-1 text-xs text-red-500">{errors.job_title.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">📅 Hire Date</label>
            <input
              type="date"
              {...register('hire_date')}
              className={inputClass(!!errors.hire_date)}
            />
            {errors.hire_date && (
              <p className="mt-1 text-xs text-red-500">{errors.hire_date.message}</p>
            )}
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
            {busy ? '⏳ Saving…' : isEdit ? '💾 Save Changes' : '✅ Create Employee'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
