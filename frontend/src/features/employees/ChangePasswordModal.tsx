import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useAdminSetPassword } from '@/lib/queries/useEmployees'
import type { EmployeeWithDepartment } from '@/types/database.types'

export function ChangePasswordModal({
  open,
  onClose,
  employee,
}: {
  open: boolean
  onClose: () => void
  employee: EmployeeWithDepartment | null
}) {
  const setPassword = useAdminSetPassword()
  const [password, setPasswordValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleClose() {
    setPasswordValue('')
    setConfirm('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!employee) return
    try {
      await setPassword.mutateAsync({ employee_id: employee.employee_id, new_password: password })
      setSuccess(true)
      setPasswordValue('')
      setConfirm('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (!employee) return null

  return (
    <Modal open={open} onClose={handleClose} title={`🔑 Change Password — ${employee.first_name} ${employee.last_name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          This sets a new login password for <strong>{employee.email}</strong>. They'll need to use
          it the next time they sign in.
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30">
            ⚠️ {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600 dark:bg-green-950/30">
            ✅ Password updated.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={setPassword.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {setPassword.isPending ? '⏳ Saving…' : '🔑 Set Password'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
