import { useMemo, useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { useTheme, ACCENT_OPTIONS } from '@/theme/ThemeProvider'
import { supabase } from '@/lib/supabaseClient'
import { Badge } from '@/components/ui/Badge'

export function SettingsPage() {
  const { employee, role } = useAuth()
  const { mode, accent, setMode, setAccent } = useTheme()

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null)
  const [pwdError, setPwdError] = useState<string | null>(null)

  // Password Validation Rules
  const pwdLengthError = useMemo(() => {
    if (newPassword && newPassword.length < 8) return 'New password must be at least 8 characters long.'
    return null
  }, [newPassword])

  const pwdMatchError = useMemo(() => {
    if (confirmPassword && confirmPassword !== newPassword) return 'Passwords do not match.'
    return null
  }, [newPassword, confirmPassword])

  const isPasswordValid =
    newPassword.length >= 8 && confirmPassword === newPassword && !pwdLengthError && !pwdMatchError

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (!isPasswordValid) return

    setPwdLoading(true)
    setPwdSuccess(null)
    setPwdError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setPwdSuccess('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPwdError(err.message || 'Failed to update password.')
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>⚙️</span> Account & System Settings
        </h2>
        <p className="text-sm text-gray-500">
          Manage your personal preferences, theme customizer, security credentials, and access roles.
        </p>
      </div>

      {/* 1. Theme & Appearance Customizer */}
      <div className="rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-sm dark:border-gray-800 space-y-5">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🎨</span> Theme & Appearance
          </h3>
          <p className="text-xs text-gray-500">Customize display mode and primary theme accent color.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dark / Light Toggle */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Display Theme</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMode('light')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  mode === 'light'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
                }`}
              >
                <span>☀️</span> Light Mode
              </button>
              <button
                type="button"
                onClick={() => setMode('dark')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  mode === 'dark'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
                }`}
              >
                <span>🌙</span> Dark Mode
              </button>
            </div>
          </div>

          {/* Preset Swatch Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
              Preset Accent Color Swatch
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ACCENT_OPTIONS.map((opt) => {
                const isSelected = accent === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAccent(opt.value)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-medium capitalize transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/40 font-bold bg-primary/10'
                        : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Personal Profile Info */}
      <div className="rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-sm dark:border-gray-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>👤</span> Profile & Account Details
          </h3>
          <p className="text-xs text-gray-500">Your profile information as registered in the organization directory.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl border border-gray-100 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs text-gray-400 font-semibold uppercase">Full Name</span>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
              {employee ? `${employee.first_name} ${employee.last_name}` : '—'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs text-gray-400 font-semibold uppercase">Email Address</span>
            <p className="font-mono text-xs text-gray-800 dark:text-gray-200 mt-1">{employee?.email ?? '—'}</p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs text-gray-400 font-semibold uppercase">Assigned Role</span>
            <div className="mt-1">
              <Badge value={role ?? 'employee'} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs text-gray-400 font-semibold uppercase">Job Title</span>
            <p className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{employee?.job_title ?? 'Not specified'}</p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs text-gray-400 font-semibold uppercase">Hire Date</span>
            <p className="font-mono text-xs text-gray-800 dark:text-gray-200 mt-1">{employee?.hire_date ?? '—'}</p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs text-gray-400 font-semibold uppercase">Employment Status</span>
            <div className="mt-1">
              <Badge value={employee?.status ?? 'active'} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Security & Password Update Form */}
      <div className="rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-sm dark:border-gray-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🔒</span> Password & Security Credentials
          </h3>
          <p className="text-xs text-gray-500">Update your access password with real-time validation.</p>
        </div>

        {pwdSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300">
            ✅ {pwdSuccess}
          </div>
        )}

        {pwdError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300">
            ❌ {pwdError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password…"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters…"
              className={`mt-1 w-full rounded-lg border p-2.5 text-sm dark:bg-gray-900 ${
                pwdLengthError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-700'
              }`}
              required
            />
            {pwdLengthError && <p className="text-xs text-red-500 mt-1">{pwdLengthError}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password…"
              className={`mt-1 w-full rounded-lg border p-2.5 text-sm dark:bg-gray-900 ${
                pwdMatchError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-700'
              }`}
              required
            />
            {pwdMatchError && <p className="text-xs text-red-500 mt-1">{pwdMatchError}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isPasswordValid || pwdLoading}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all ${
                isPasswordValid
                  ? 'bg-primary hover:bg-primary-hover shadow-sm'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 dark:bg-gray-800 dark:text-gray-500'
              }`}
            >
              {pwdLoading ? '⏳ Updating Password…' : 'Update Security Password'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Access Control Matrix Reference */}
      <div className="rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-sm dark:border-gray-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🛡️</span> Role Privileges & Access Boundaries
          </h3>
          <p className="text-xs text-gray-500">Your role-based access matrix permissions enforced at database level.</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 text-xs space-y-2">
          <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Employee Directory & Management</span>
            <span className="font-medium text-gray-500">{role === 'admin' ? '✅ Full CRUD' : role === 'manager' ? '👁️ Dept View' : '👤 Self Only'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Leave Approvals</span>
            <span className="font-medium text-gray-500">{role === 'admin' ? '✅ All Requests' : role === 'manager' ? '✅ Dept Requests' : '❌ Request Only'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Payroll Disbursement</span>
            <span className="font-medium text-gray-500">{role === 'admin' ? '✅ Generate & Pay' : role === 'manager' ? '👁️ Dept Read-Only' : '📄 Own Payslips'}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Audit Trail Inspector</span>
            <span className="font-medium text-gray-500">{role === 'admin' ? '✅ Full Access' : '🚫 Restricted'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
