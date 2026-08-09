import { useRef, useMemo, useState, useCallback } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { useTheme, ACCENT_OPTIONS } from '@/theme/ThemeProvider'
import { supabase } from '@/lib/supabaseClient'
import { Badge } from '@/components/ui/Badge'
import { useUploadAvatar, useRemoveAvatar } from '@/lib/queries/useAvatar'
import { AvatarCropModal } from './AvatarCropModal'

/** Returns initials (up to 2 chars) for the avatar fallback. */
function getInitials(first?: string, last?: string) {
  return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || '?'
}

export function SettingsPage() {
  const { employee, role, refreshEmployee } = useAuth()
  const { mode, accent, setMode, setAccent } = useTheme()

  // ── Avatar State ──────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  /** The raw File waiting to be cropped — null when no crop modal is open */
  const [cropFile, setCropFile] = useState<File | null>(null)

  const uploadAvatar = useUploadAvatar()
  const removeAvatar = useRemoveAvatar()

  /**
   * Step 1 — file picker callback.
   * Validates the file then opens the crop modal instead of uploading directly.
   */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Client-side validation — max 10 MB (before crop compression)
      if (file.size > 10 * 1024 * 1024) {
        setAvatarError('Image must be smaller than 10 MB.')
        return
      }
      if (!file.type.startsWith('image/')) {
        setAvatarError('Only image files are supported.')
        return
      }

      setAvatarError(null)
      setAvatarSuccess(null)
      // Reset the input so the same file can be re-selected later
      if (fileInputRef.current) fileInputRef.current.value = ''
      // Open crop modal
      setCropFile(file)
    },
    []
  )

  /**
   * Step 2 — called by AvatarCropModal with the final PNG blob.
   * Uploads the cropped blob as a File to the edge function.
   */
  const handleCropConfirm = useCallback(
    async (blob: Blob) => {
      setCropFile(null)
      const croppedFile = new File([blob], 'avatar.png', { type: 'image/png' })
      try {
        await uploadAvatar.mutateAsync(croppedFile)
        await refreshEmployee()
        setAvatarSuccess('Profile picture updated successfully!')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed.'
        setAvatarError(msg)
      }
    },
    [uploadAvatar, refreshEmployee]
  )

  const handleRemoveConfirmed = useCallback(async () => {
    setConfirmRemove(false)
    setAvatarError(null)
    setAvatarSuccess(null)
    try {
      await removeAvatar.mutateAsync()
      await refreshEmployee()
      setAvatarSuccess('Profile picture removed.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove picture.'
      setAvatarError(msg)
    }
  }, [removeAvatar, refreshEmployee])

  // ── Security Form State ───────────────────────────────────────────────────
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.'
      setPwdError(msg)
    } finally {
      setPwdLoading(false)
    }
  }

  const initials = getInitials(employee?.first_name, employee?.last_name)
  const isAvatarBusy = uploadAvatar.isPending || removeAvatar.isPending || !!cropFile

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>⚙️</span> Account &amp; System Settings
        </h2>
        <p className="text-sm text-gray-500">
          Manage your personal preferences, theme customizer, security credentials, and access roles.
        </p>
      </div>

      {/* ── 1. Profile Picture ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-sm dark:border-gray-800 space-y-5">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🖼️</span> Profile Picture
          </h3>
          <p className="text-xs text-gray-500">
            Upload a profile picture (JPG, PNG, GIF, WEBP, AVIF, SVG, BMP…). Max 10 MB.
            You'll be able to reposition and zoom before it's saved.
            It appears next to your name in the sidebar.
          </p>
        </div>

        {/* Feedback banners */}
        {avatarSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300">
            ✅ {avatarSuccess}
          </div>
        )}
        {avatarError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300">
            ❌ {avatarError}
          </div>
        )}

        <div className="flex items-center gap-6">
          {/* Avatar preview — 96 px circle */}
          <div className="relative flex-shrink-0">
            {employee?.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt="Your profile picture"
                className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/30"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center ring-4 ring-primary/20">
                <span className="text-3xl font-bold text-white leading-none">{initials}</span>
              </div>
            )}

            {/* Loading spinner overlay */}
            {isAvatarBusy && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <svg
                  className="h-7 w-7 animate-spin text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-2">
            {/* Hidden file input — accepts ALL image formats */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isAvatarBusy}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAvatarBusy}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-hover shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📷 {employee?.avatar_url ? 'Change Picture' : 'Upload Picture'}
            </button>

            {employee?.avatar_url && !confirmRemove && (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                disabled={isAvatarBusy}
                className="flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️ Remove Picture
              </button>
            )}

            {/* Inline remove confirmation */}
            {confirmRemove && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Are you sure?</span>
                <button
                  type="button"
                  onClick={handleRemoveConfirmed}
                  disabled={isAvatarBusy}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  Yes, Remove
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-1">
              Supported: JPG, PNG, GIF, WEBP, AVIF, SVG, BMP, TIFF
            </p>
          </div>
        </div>
      </div>

      {/* ── Crop Modal (portal-style, rendered above everything) ────────── */}
      {cropFile && (
        <AvatarCropModal
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}

      {/* ── 2. Theme & Appearance ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-sm dark:border-gray-800 space-y-5">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🎨</span> Theme &amp; Appearance
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

      {/* ── 3. Personal Profile Info ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-sm dark:border-gray-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>👤</span> Profile &amp; Account Details
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

      {/* ── 4. Security & Password Update Form ────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-sm dark:border-gray-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🔒</span> Password &amp; Security Credentials
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

      {/* ── 5. Access Control Matrix Reference ────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-sm dark:border-gray-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🛡️</span> Role Privileges &amp; Access Boundaries
          </h3>
          <p className="text-xs text-gray-500">Your role-based access matrix permissions enforced at database level.</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 text-xs space-y-2">
          <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Employee Directory &amp; Management</span>
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
