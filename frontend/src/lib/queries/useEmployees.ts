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
  gender?: 'M' | 'F' | null
  department_id?: number | null
  manager_employee_id?: number | null
  job_title?: string
  hire_date?: string
  role: UserRole
}

// Creation goes through the Edge Function since it needs the secret key
async function syncEmployeeDepartmentAndRole(emp: Employee) {
  if (emp.role === 'admin') {
    // Admin cannot belong to a department or manage a department
    if (emp.department_id !== null) {
      await supabase.from('employee').update({ department_id: null }).eq('employee_id', emp.employee_id)
    }
    await supabase.from('department').update({ manager_id: null }).eq('manager_id', emp.employee_id)
  } else if (emp.role === 'manager' && emp.department_id) {
    // Unassign this manager from any other department (1 manager = 1 department)
    await supabase
      .from('department')
      .update({ manager_id: null })
      .eq('manager_id', emp.employee_id)
      .neq('department_id', emp.department_id)

    // Set this department's manager to this manager
    await supabase
      .from('department')
      .update({ manager_id: emp.employee_id })
      .eq('department_id', emp.department_id)
  } else if (emp.role === 'employee') {
    // Demoted from manager — clear department manager_id if set
    await supabase.from('department').update({ manager_id: null }).eq('manager_id', emp.employee_id)
  }
}

// Creation goes through the Edge Function since it needs the secret key
// to also create the auth.users login — admin-only, enforced server-side too.
export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const payload = {
        ...input,
        department_id: input.role === 'admin' ? null : (input.department_id ?? null),
      }
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: payload,
        headers: { Authorization: `Bearer ${token}` },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      const emp = data.employee as Employee
      if (emp?.employee_id) {
        await syncEmployeeDepartmentAndRole(emp)
      }
      return emp
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })
}

export interface UpdateEmployeeInput {
  employee_id: number
  first_name?: string
  last_name?: string
  email?: string
  gender?: 'M' | 'F' | null
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
      const payload = {
        ...rest,
        department_id: rest.role === 'admin' ? null : (rest.department_id ?? null),
      }
      const { data, error } = await supabase
        .from('employee')
        .update(payload)
        .eq('employee_id', employee_id)
        .select()
        .single()
      if (error) throw error
      const emp = data as Employee
      if (emp?.employee_id) {
        await syncEmployeeDepartmentAndRole(emp)
      }
      return emp
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
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

// Reverses a termination via Edge Function (also re-enables their login).
// Mirrors useDeactivateEmployee — requires a matching 'reactivate-employee'
// Edge Function to be deployed on the Supabase side.
export function useReactivateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (employee_id: number) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const { data, error } = await supabase.functions.invoke('reactivate-employee', {
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

// Permanently deletes an employee record (and unlinks all foreign key references)
export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (employee_id: number) => {
      // 1. Clean up references
      await supabase.from('department').update({ manager_id: null }).eq('manager_id', employee_id)
      await supabase.from('project').update({ manager_id: null }).eq('manager_id', employee_id)
      await supabase.from('assignment').delete().eq('employee_id', employee_id)
      await supabase.from('user_preferences').delete().eq('employee_id', employee_id)

      // 2. Try calling Edge Function to also clean up auth user if deployed
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        await supabase.functions.invoke('delete-employee', {
          body: { employee_id },
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // Ignore edge function error fallback to direct table delete
      }

      // 3. Delete employee row
      const { error } = await supabase.from('employee').delete().eq('employee_id', employee_id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })
}
