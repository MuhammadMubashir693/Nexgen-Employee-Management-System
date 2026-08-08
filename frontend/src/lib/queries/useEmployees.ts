import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type {
  Employee,
  EmployeeWithDepartment,
  UserRole,
} from '@/types/database.types'

// ============================================================
// LIST EMPLOYEES
// ============================================================
// RLS scopes this automatically:
// - admin    → everyone
// - manager  → their department
// - employee → themselves
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee')
        .select(
          '*, department:department_id(department_id, name)'
        )
        .order('first_name')

      if (error) throw error

      return data as unknown as EmployeeWithDepartment[]
    },
  })
}

// ============================================================
// CREATE EMPLOYEE
// ============================================================

export interface CreateEmployeeInput {
  email: string
  password: string
  first_name: string
  last_name: string
  gender?: 'M' | 'F'
  department_id?: number | null
  manager_employee_id?: number | null
  job_title?: string
  hire_date?: string
  role: UserRole
}


export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const { data: sessionData } =
        await supabase.auth.getSession()

      const token = sessionData.session?.access_token

      if (!token) {
        throw new Error('Not authenticated')
      }

      const { data, error } =
        await supabase.functions.invoke('create-employee', {
          body: input,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

      if (error) throw error

      if (data?.error) {
        throw new Error(data.error)
      }

      return data.employee as Employee
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['employees'],
      })
    },
  })
}

// ============================================================
// UPDATE EMPLOYEE
// ============================================================

export interface UpdateEmployeeInput {
  employee_id: number
  first_name?: string
  last_name?: string
  email?: string
  department_id?: number | null
  manager_employee_id?: number | null
  job_title?: string
  hire_date?: string
  role?: UserRole
  status?: Employee['status']
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      employee_id,
      ...rest
    }: UpdateEmployeeInput) => {
      const { data, error } = await supabase
        .from('employee')
        .update(rest)
        .eq('employee_id', employee_id)
        .select()
        .single()

      if (error) throw error

      return data as Employee
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['employees'],
      })
    },
  })
}

// ============================================================
// DEACTIVATE EMPLOYEE
// ============================================================
// Soft-deletes the employee:
// - employee.status → terminated
// - Supabase Auth user → banned
//
// The Edge Function performs the admin authorization check.

export function useDeactivateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (employee_id: number) => {
      const { data: sessionData } =
        await supabase.auth.getSession()

      const token = sessionData.session?.access_token

      if (!token) {
        throw new Error('Not authenticated')
      }

      const { data, error } =
        await supabase.functions.invoke(
          'deactivate-employee',
          {
            body: { employee_id },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

      if (error) throw error

      if (data?.error) {
        throw new Error(data.error)
      }

      return data.employee as Employee
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['employees'],
      })
    },
  })
}

// ============================================================
// REACTIVATE EMPLOYEE
// ============================================================
// Reverses deactivation:
// - employee.status → active
// - Supabase Auth user → unbanned
//
// The Edge Function performs the admin authorization check.

export function useReactivateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (employee_id: number) => {
      const { data: sessionData } =
        await supabase.auth.getSession()

      const token = sessionData.session?.access_token

      if (!token) {
        throw new Error('Not authenticated')
      }

      const { data, error } =
        await supabase.functions.invoke(
          'reactivate-employee',
          {
            body: { employee_id },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

      if (error) throw error

      if (data?.error) {
        throw new Error(data.error)
      }

      return data.employee as Employee
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['employees'],
      })
    },
  })
}
