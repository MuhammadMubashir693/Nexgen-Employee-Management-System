import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange', // live, keystroke-by-keystroke validation
  })

  async function onSubmit(values: LoginForm) {
    setSubmitting(true)
    setServerError(null)
    const { error } = await signIn(values.email, values.password)
    setSubmitting(false)
    if (error) {
      setServerError(error)
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-surface-alt p-8 shadow-sm dark:border-gray-800">
        <div className="mb-6 text-center">
          <div className="mb-2 text-3xl">👨🏻‍🦱</div>
          <h1 className="text-xl font-semibold">Sign in to EMS</h1>
          <p className="text-sm text-gray-500">Employee Management System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">📧 Email</label>
            <input
              type="email"
              {...register('email')}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                errors.email
                  ? 'border-red-400 bg-red-50 text-gray-400 dark:bg-red-950/30'
                  : 'border-gray-300 bg-white focus:border-primary dark:border-gray-700 dark:bg-gray-900'
              }`}
              placeholder="you@company.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">🔒 Password</label>
            <input
              type="password"
              {...register('password')}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                errors.password
                  ? 'border-red-400 bg-red-50 text-gray-400 dark:bg-red-950/30'
                  : 'border-gray-300 bg-white focus:border-primary dark:border-gray-700 dark:bg-gray-900'
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30">
              ⚠️ {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={!isValid || submitting}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? '⏳ Signing in…' : '➡️ Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Accounts are created by your admin — no self sign-up.
        </p>
      </div>
    </div>
  )
}
