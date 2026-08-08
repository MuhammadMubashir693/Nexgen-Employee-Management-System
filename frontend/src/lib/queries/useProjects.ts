import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Project, ProjectWithRelations } from '@/types/database.types'

// List — RLS scopes this per role: admin sees everything, manager sees
// projects in their department, employee sees only projects they're
// assigned to. Pulls department, manager, and the assignment roster in
// one round trip so the list/detail views don't need extra queries.
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project')
        .select(
          `*,
          department:department_id(department_id, name),
          manager:manager_id(employee_id, first_name, last_name),
          assignments:assignment(employee_id, assigned_role, employee:employee_id(employee_id, first_name, last_name))`
        )
        .order('start_date', { ascending: false })
      if (error) throw error
      return data as unknown as ProjectWithRelations[]
    },
  })
}

export interface ProjectInput {
  project_name: string
  department_id?: number | null
  manager_id?: number | null
  start_date?: string | null
  end_date?: string | null
  budget?: number | null
  status?: Project['status']
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ProjectInput) => {
      const { data, error } = await supabase.from('project').insert(input).select().single()
      if (error) throw error
      return data as Project
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ project_id, ...rest }: ProjectInput & { project_id: number }) => {
      const { data, error } = await supabase
        .from('project')
        .update(rest)
        .eq('project_id', project_id)
        .select()
        .single()
      if (error) throw error
      return data as Project
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (project_id: number) => {
      const { error } = await supabase.from('project').delete().eq('project_id', project_id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

// Assigns an employee to a project (upsert so re-assigning just updates
// their role rather than erroring on the composite primary key).
export function useAssignEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      project_id,
      employee_id,
      assigned_role,
    }: {
      project_id: number
      employee_id: number
      assigned_role?: string | null
    }) => {
      const { error } = await supabase
        .from('assignment')
        .upsert({ project_id, employee_id, assigned_role }, { onConflict: 'employee_id,project_id' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUnassignEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ project_id, employee_id }: { project_id: number; employee_id: number }) => {
      const { error } = await supabase
        .from('assignment')
        .delete()
        .eq('project_id', project_id)
        .eq('employee_id', employee_id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}
