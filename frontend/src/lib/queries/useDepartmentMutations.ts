import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Department } from '@/types/database.types'

export interface DepartmentInput {
  name: string
  location?: string
  manager_id?: number | null
}

// Keeps employee.department_id in sync with department.manager_id — a
// department's manager should always belong to that department. Runs after
// the department row itself is written.
async function syncManagerDepartment(department_id: number, manager_id?: number | null) {
  if (manager_id) {
    // Clear manager_id from any other department currently managed by this manager (1 manager = 1 dept)
    await supabase
      .from('department')
      .update({ manager_id: null })
      .eq('manager_id', manager_id)
      .neq('department_id', department_id)

    // Move the manager employee to this department
    const { error } = await supabase
      .from('employee')
      .update({ department_id })
      .eq('employee_id', manager_id)
    if (error) throw error
  }
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DepartmentInput) => {
      const manager_id = input.manager_id ? Number(input.manager_id) : null
      const { data, error } = await supabase
        .from('department')
        .insert({ ...input, manager_id })
        .select()
        .single()
      if (error) throw error
      await syncManagerDepartment(data.department_id, manager_id)
      return data as Department
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      department_id,
      ...rest
    }: DepartmentInput & { department_id: number }) => {
      const manager_id = rest.manager_id ? Number(rest.manager_id) : null
      const { data, error } = await supabase
        .from('department')
        .update({ ...rest, manager_id })
        .eq('department_id', department_id)
        .select()
        .single()
      if (error) throw error
      await syncManagerDepartment(department_id, manager_id)
      return data as Department
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (department_id: number) => {
      const { error } = await supabase.from('department').delete().eq('department_id', department_id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })
}
