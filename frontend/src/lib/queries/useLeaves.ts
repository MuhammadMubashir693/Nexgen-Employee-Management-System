import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Leave, LeaveWithRelations } from '@/types/database.types'

export function useLeaves(filters?: {
  employeeId?: number
  departmentId?: number
  approvalStatus?: string
  leaveType?: string
}) {
  return useQuery({
    queryKey: ['leaves', filters],
    queryFn: async () => {
      let query = supabase
        .from('leaves')
        .select(`
          *,
          employee:employee_id(
            employee_id,
            first_name,
            last_name,
            email,
            department_id,
            department:department_id(department_id, name)
          ),
          approver:approved_by(
            employee_id,
            first_name,
            last_name
          )
        `)
        .order('requested_at', { ascending: false })

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId)
      }
      if (filters?.approvalStatus && filters.approvalStatus !== 'all') {
        query = query.eq('approval_status', filters.approvalStatus)
      }
      if (filters?.leaveType && filters.leaveType !== 'all') {
        query = query.eq('leave_type', filters.leaveType)
      }

      const { data, error } = await query
      if (error) throw error

      let result = (data || []) as unknown as LeaveWithRelations[]
      if (filters?.departmentId) {
        result = result.filter((row) => row.employee?.department_id === filters.departmentId)
      }

      return result
    },
  })
}

export interface RequestLeaveInput {
  employee_id: number
  leave_type: Leave['leave_type']
  start_date: string
  end_date: string
  reason?: string
}

export function useRequestLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RequestLeaveInput) => {
      const { data, error } = await supabase
        .from('leaves')
        .insert({
          employee_id: input.employee_id,
          leave_type: input.leave_type,
          start_date: input.start_date,
          end_date: input.end_date,
          reason: input.reason || null,
          approval_status: 'pending',
        })
        .select()
        .single()

      if (error) throw error
      return data as Leave
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
    },
  })
}

export interface UpdateLeaveStatusInput {
  leave_id: number
  decision: 'approved' | 'rejected'
  approved_by?: number
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ leave_id, decision, approved_by }: UpdateLeaveStatusInput) => {
      // 1. Try Edge Function invoke first
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        const { data, error } = await supabase.functions.invoke('approve-leave', {
          body: { leave_id, decision },
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!error && data?.success) {
          return data.leave as Leave
        }
      } catch {
        // Fall back to direct database table update if edge function is not deployed locally
      }

      // 2. Fallback DB Table update
      const { data, error } = await supabase
        .from('leaves')
        .update({
          approval_status: decision,
          approved_by: approved_by || null,
        })
        .eq('leave_id', leave_id)
        .select()
        .single()

      if (error) throw error

      // If approved and dates cover today, update employee status to on_leave
      if (decision === 'approved' && data) {
        const today = new Date().toISOString().split('T')[0]
        if (data.start_date <= today && data.end_date >= today) {
          await supabase
            .from('employee')
            .update({ status: 'on_leave' })
            .eq('employee_id', data.employee_id)
        }
      }

      return data as Leave
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useCancelLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (leave_id: number) => {
      const { error } = await supabase.from('leaves').delete().eq('leave_id', leave_id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
    },
  })
}
