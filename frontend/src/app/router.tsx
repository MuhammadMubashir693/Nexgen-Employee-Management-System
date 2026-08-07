import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { UnauthorizedPage } from '@/features/auth/UnauthorizedPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { EmployeesPage } from '@/features/employees/EmployeesPage'
import { DepartmentsPage } from '@/features/departments/DepartmentsPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { AttendancePage } from '@/features/attendance/AttendancePage'
import { LeavesPage } from '@/features/leaves/LeavesPage'
import { PayrollPage } from '@/features/payroll/PayrollPage'
import { AuditLogPage } from '@/features/auditLog/AuditLogPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  {
    element: <ProtectedRoute />, // any logged-in user
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/attendance', element: <AttendancePage /> },
          { path: '/leaves', element: <LeavesPage /> },
          { path: '/payroll', element: <PayrollPage /> },
          { path: '/settings', element: <SettingsPage /> },

          // Admin + manager only
          {
            element: <ProtectedRoute allowedRoles={['admin', 'manager']} />,
            children: [{ path: '/employees', element: <EmployeesPage /> }],
          },

          // Admin only
          {
            element: <ProtectedRoute allowedRoles={['admin']} />,
            children: [
              { path: '/departments', element: <DepartmentsPage /> },
              { path: '/audit-log', element: <AuditLogPage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
