import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Payroll, PayrollWithEmployee } from '@/types/database.types'

export function usePayroll(filters?: {
  employeeId?: number
  departmentId?: number
  paymentStatus?: string
  startDate?: string
  endDate?: string
}) {
  return useQuery({
    queryKey: ['payroll', filters],
    queryFn: async () => {
      let query = supabase
        .from('payroll')
        .select(`
          *,
          employee:employee_id(
            employee_id,
            first_name,
            last_name,
            email,
            job_title,
            department_id,
            department:department_id(department_id, name)
          )
        `)
        .order('period_end', { ascending: false })

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId)
      }
      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        query = query.eq('payment_status', filters.paymentStatus)
      }
      if (filters?.startDate) {
        query = query.gte('period_start', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('period_end', filters.endDate)
      }

      const { data, error } = await query
      if (error) throw error

      let result = (data || []) as unknown as PayrollWithEmployee[]
      if (filters?.departmentId) {
        result = result.filter((row) => row.employee?.department_id === filters.departmentId)
      }

      return result
    },
  })
}

export interface GeneratePayrollInput {
  employee_id?: number | null
  department_id?: number | null
  period_start: string
  period_end: string
  gross_pay: number
  net_pay: number
  deduction_percent?: number
  pay_date?: string
  payment_status?: 'pending' | 'paid'
}

export function useGeneratePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: GeneratePayrollInput) => {
      // 1. If batch generation for department or single employee via Edge Function
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        const { data, error } = await supabase.functions.invoke('generate-payroll', {
          body: {
            period_start: input.period_start,
            period_end: input.period_end,
            department_id: input.department_id,
            employee_id: input.employee_id,
            gross_pay: input.gross_pay,
            deduction_percent: input.deduction_percent ?? 0,
            pay_date: input.pay_date,
            payment_status: input.payment_status ?? 'pending',
          },
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!error && data?.success) {
          return data.records as Payroll[]
        }
      } catch {
        // Fall back to direct DB insert
      }

      // 2. Direct DB Insert Fallback
      if (input.employee_id) {
        const { data, error } = await supabase
          .from('payroll')
          .insert({
            employee_id: input.employee_id,
            period_start: input.period_start,
            period_end: input.period_end,
            gross_pay: input.gross_pay,
            net_pay: input.net_pay,
            pay_date: input.pay_date || new Date().toISOString().split('T')[0],
            payment_status: input.payment_status || 'pending',
          })
          .select()

        if (error) throw error
        return data as Payroll[]
      } else {
        // Batch generate for all or department active employees via query
        let query = supabase.from('employee').select('employee_id').neq('status', 'terminated')
        if (input.department_id) {
          query = query.eq('department_id', input.department_id)
        }
        const { data: emps, error: empErr } = await query
        if (empErr) throw empErr
        if (!emps || emps.length === 0) throw new Error('No active employees found for payroll generation')

        const records = emps.map((e) => ({
          employee_id: e.employee_id,
          period_start: input.period_start,
          period_end: input.period_end,
          gross_pay: input.gross_pay,
          net_pay: input.net_pay,
          pay_date: input.pay_date || new Date().toISOString().split('T')[0],
          payment_status: input.payment_status || 'pending',
        }))

        const { data, error } = await supabase.from('payroll').insert(records).select()
        if (error) throw error
        return data as Payroll[]
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
    },
  })
}

export interface UpdatePayrollInput {
  payroll_id: number
  gross_pay?: number
  net_pay?: number
  payment_status?: Payroll['payment_status']
  pay_date?: string
}

export function useUpdatePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ payroll_id, ...payload }: UpdatePayrollInput) => {
      const { data, error } = await supabase
        .from('payroll')
        .update(payload)
        .eq('payroll_id', payroll_id)
        .select()
        .single()

      if (error) throw error
      return data as Payroll
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
    },
  })
}

export function useDeletePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payroll_id: number) => {
      const { error } = await supabase.from('payroll').delete().eq('payroll_id', payroll_id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
    },
  })
}
