import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Employee, EmployeeWithDepartment, UserRole } from '@/types/database.types'

// List — RLS already scopes this per role: admin sees everyone,
// manager sees their department, employee sees only themself.
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee')
        .select('*, department:department_id(department_id, name)')
        .order('first_name')
      if (error) throw error
      return data as unknown as EmployeeWithDepartment[]
    },
  })
}

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

// Creation goes through the Edge Function since it needs the secret key
// to also create the auth.users login — admin-only, enforced server-side too.
export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: input,
        headers: { Authorization: `Bearer ${token}` },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data.employee as Employee
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

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

// Regular table update — RLS enforces who's allowed to touch what.
export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ employee_id, ...rest }: UpdateEmployeeInput) => {
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
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// Soft-delete via Edge Function (also disables their login).
export function useDeactivateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (employee_id: number) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const { data, error } = await supabase.functions.invoke('deactivate-employee', {
        body: { employee_id },
        headers: { Authorization: `Bearer ${token}` },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data.employee as Employee
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}
