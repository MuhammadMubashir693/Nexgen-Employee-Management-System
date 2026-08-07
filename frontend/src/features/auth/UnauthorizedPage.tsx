import { Link } from 'react-router-dom'

export function UnauthorizedPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 text-center">
      <div className="text-5xl">🚫</div>
      <h1 className="text-xl font-semibold">You don't have access to this page</h1>
      <p className="text-gray-500">This section isn't available for your account type.</p>
      <Link to="/dashboard" className="mt-2 text-primary hover:underline">
        ⬅️ Back to Dashboard
      </Link>
    </div>
  )
}
