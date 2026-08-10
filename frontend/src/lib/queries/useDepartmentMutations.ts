import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Department } from '@/types/database.types'

export interface DepartmentInput {
  name: string
  location?: string
  manager_id?: number | null
}

/**
 * Keeps employee.department_id synchronized with department.manager_id.
 *
 * Rules:
 * - A manager can manage only ONE department.
 * - A department can have only ONE manager.
 * - A manager already assigned to another department cannot be assigned here.
 * - When changing managers, the old manager is unassigned from the department.
 */
async function syncManagerDepartment(
  department_id: number,
  manager_id?: number | null,
  previous_manager_id?: number | null
) {
  const newManagerId = manager_id ?? null
  const oldManagerId = previous_manager_id ?? null

  // If a new manager is being assigned, make sure they are not
  // already the manager of another department.
  if (newManagerId) {
    const { data: existingDepartment, error: existingError } =
      await supabase
        .from('department')
        .select('department_id, name')
        .eq('manager_id', newManagerId)
        .neq('department_id', department_id)
        .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existingDepartment) {
      throw new Error(
        `This manager is already assigned to "${existingDepartment.name}". A manager can only manage one department.`
      )
    }

    // Make sure the selected employee is actually an active manager.
    const { data: manager, error: managerError } = await supabase
      .from('employee')
      .select('employee_id, role, status')
      .eq('employee_id', newManagerId)
      .maybeSingle()

    if (managerError) {
      throw managerError
    }

    if (!manager) {
      throw new Error('Selected manager was not found.')
    }

    if (manager.role !== 'manager') {
      throw new Error('Only employees with the manager role can manage a department.')
    }

    if (manager.status === 'terminated') {
      throw new Error('A terminated employee cannot be assigned as a department manager.')
    }

    // Assign the new manager to this department.
    const { error: assignError } = await supabase
      .from('employee')
      .update({ department_id })
      .eq('employee_id', newManagerId)

    if (assignError) {
      throw assignError
    }
  }

  // If the manager was changed or removed, clear the old manager's
  // department assignment — but only if they are still assigned to
  // this department.
  if (oldManagerId && oldManagerId !== newManagerId) {
    const { error: clearError } = await supabase
      .from('employee')
      .update({ department_id: null })
      .eq('employee_id', oldManagerId)
      .eq('department_id', department_id)

    if (clearError) {
      throw clearError
    }
  }
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DepartmentInput) => {
      const manager_id = input.manager_id
        ? Number(input.manager_id)
        : null

      // Validate the manager BEFORE creating the department.
      if (manager_id) {
        const { data: existingDepartment, error: existingError } =
          await supabase
            .from('department')
            .select('department_id, name')
            .eq('manager_id', manager_id)
            .maybeSingle()

        if (existingError) {
          throw existingError
        }

        if (existingDepartment) {
          throw new Error(
            `This manager is already assigned to "${existingDepartment.name}". A manager can only manage one department.`
          )
        }

        const { data: manager, error: managerError } = await supabase
          .from('employee')
          .select('employee_id, role, status')
          .eq('employee_id', manager_id)
          .maybeSingle()

        if (managerError) {
          throw managerError
        }

        if (!manager) {
          throw new Error('Selected manager was not found.')
        }

        if (manager.role !== 'manager') {
          throw new Error(
            'Only employees with the manager role can manage a department.'
          )
        }

        if (manager.status === 'terminated') {
          throw new Error(
            'A terminated employee cannot be assigned as a department manager.'
          )
        }
      }

      const { data, error } = await supabase
        .from('department')
        .insert({
          ...input,
          manager_id,
        })
        .select()
        .single()

      if (error) throw error

      await syncManagerDepartment(
        data.department_id,
        manager_id,
        null
      )

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
      const manager_id = rest.manager_id
        ? Number(rest.manager_id)
        : null

      // Get the existing manager before changing the department.
      const { data: existingDepartment, error: existingError } =
        await supabase
          .from('department')
          .select('manager_id')
          .eq('department_id', department_id)
          .single()

      if (existingError) {
        throw existingError
      }

      const previous_manager_id = existingDepartment.manager_id ?? null

      // Validate the new manager before changing anything.
      if (manager_id) {
        const { data: conflictingDepartment, error: conflictError } =
          await supabase
            .from('department')
            .select('department_id, name')
            .eq('manager_id', manager_id)
            .neq('department_id', department_id)
            .maybeSingle()

        if (conflictError) {
          throw conflictError
        }

        if (conflictingDepartment) {
          throw new Error(
            `This manager is already assigned to "${conflictingDepartment.name}". A manager can only manage one department.`
          )
        }

        const { data: manager, error: managerError } = await supabase
          .from('employee')
          .select('employee_id, role, status')
          .eq('employee_id', manager_id)
          .maybeSingle()

        if (managerError) {
          throw managerError
        }

        if (!manager) {
          throw new Error('Selected manager was not found.')
        }

        if (manager.role !== 'manager') {
          throw new Error(
            'Only employees with the manager role can manage a department.'
          )
        }

        if (manager.status === 'terminated') {
          throw new Error(
            'A terminated employee cannot be assigned as a department manager.'
          )
        }
      }

      const { data, error } = await supabase
        .from('department')
        .update({
          ...rest,
          manager_id,
        })
        .eq('department_id', department_id)
        .select()
        .single()

      if (error) throw error

      await syncManagerDepartment(
        department_id,
        manager_id,
        previous_manager_id
      )

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
      // Get the current manager before deleting the department.
      const { data: department, error: fetchError } = await supabase
        .from('department')
        .select('manager_id')
        .eq('department_id', department_id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      const { error } = await supabase
        .from('department')
        .delete()
        .eq('department_id', department_id)

      if (error) {
        throw error
      }

      // The department is gone, so its former manager should become
      // unassigned rather than keeping a department_id that no longer exists.
      if (department.manager_id) {
        const { error: clearManagerError } = await supabase
          .from('employee')
          .update({ department_id: null })
          .eq('employee_id', department.manager_id)
          .eq('department_id', department_id)

        if (clearManagerError) {
          throw clearManagerError
        }
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}
