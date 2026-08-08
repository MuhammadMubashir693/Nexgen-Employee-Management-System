import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Department } from '@/types/database.types'

export interface DepartmentInput {
  name: string
  location?: string
  manager_id?: number | null
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DepartmentInput) => {
      const { data, error } = await supabase.from('department').insert(input).select().single()
      if (error) throw error
      return data as Department
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      department_id,
      ...rest
    }: DepartmentInput & { department_id: number }) => {
      const { data, error } = await supabase
        .from('department')
        .update(rest)
        .eq('department_id', department_id)
        .select()
        .single()
      if (error) throw error
      return data as Department
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
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
