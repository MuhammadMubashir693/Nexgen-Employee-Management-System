import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import type { UserRole } from '@/types/database.types'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

/**
 * Guards a route by two checks:
 * 1. User must be logged in.
 * 2. If `allowedRoles` is given, the employee's role must be in that list.
 *
 * This is a UX guard only — the real security boundary is Postgres RLS.
 * But it's what keeps unauthorized nav links/pages from ever rendering.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { loading, session, role } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-2xl">
        ⏳ Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
