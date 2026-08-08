import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Attendance, AttendanceWithEmployee } from '@/types/database.types'

export function useAttendance(filters?: {
  employeeId?: number
  departmentId?: number
  startDate?: string
  endDate?: string
  status?: string
}) {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: async () => {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          employee:employee_id(
            employee_id,
            first_name,
            last_name,
            email,
            department_id,
            department:department_id(department_id, name)
          )
        `)
        .order('attendance_date', { ascending: false })

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId)
      }
      if (filters?.startDate) {
        query = query.gte('attendance_date', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('attendance_date', filters.endDate)
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query
      if (error) throw error

      // Client-side department filtering if requested
      let result = (data || []) as unknown as AttendanceWithEmployee[]
      if (filters?.departmentId) {
        result = result.filter((row) => row.employee?.department_id === filters.departmentId)
      }

      return result
    },
  })
}

export function useTodayAttendance(employeeId: number | undefined) {
  const today = new Date().toISOString().split('T')[0]
  return useQuery({
    queryKey: ['attendance', 'today', employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      if (!employeeId) return null
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('attendance_date', today)
        .maybeSingle()

      if (error) throw error
      return data as Attendance | null
    },
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (employeeId: number) => {
      const today = new Date().toISOString().split('T')[0]
      const nowTime = new Date().toTimeString().split(' ')[0] // "HH:MM:SS"

      // Check if past 09:15 AM
      const currentHour = new Date().getHours()
      const currentMin = new Date().getMinutes()
      const isLate = currentHour > 9 || (currentHour === 9 && currentMin > 15)
      const initialStatus = isLate ? 'late' : 'present'

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          employee_id: employeeId,
          attendance_date: today,
          check_in: nowTime,
          status: initialStatus,
        })
        .select()
        .single()

      if (error) throw error
      return data as Attendance
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

export function useCheckOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ attendanceId, checkInTime }: { attendanceId: number; checkInTime: string | null }) => {
      const nowTime = new Date().toTimeString().split(' ')[0]

      let hoursWorked: number | null = null
      if (checkInTime) {
        const [inH, inM] = checkInTime.split(':').map(Number)
        const [outH, outM] = nowTime.split(':').map(Number)
        const inMins = inH * 60 + inM
        const outMins = outH * 60 + outM
        if (outMins > inMins) {
          hoursWorked = Number(((outMins - inMins) / 60).toFixed(2))
        }
      }

      const { data, error } = await supabase
        .from('attendance')
        .update({
          check_out: nowTime,
          hours_worked: hoursWorked,
        })
        .eq('attendance_id', attendanceId)
        .select()
        .single()

      if (error) throw error
      return data as Attendance
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

export interface RecordAttendanceInput {
  attendance_id?: number
  employee_id: number
  attendance_date: string
  check_in?: string | null
  check_out?: string | null
  status: Attendance['status']
  hours_worked?: number | null
}

export function useRecordAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordAttendanceInput) => {
      if (input.attendance_id) {
        const { data, error } = await supabase
          .from('attendance')
          .update({
            attendance_date: input.attendance_date,
            check_in: input.check_in || null,
            check_out: input.check_out || null,
            status: input.status,
            hours_worked: input.hours_worked || null,
          })
          .eq('attendance_id', input.attendance_id)
          .select()
          .single()
        if (error) throw error
        return data as Attendance
      } else {
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            employee_id: input.employee_id,
            attendance_date: input.attendance_date,
            check_in: input.check_in || null,
            check_out: input.check_out || null,
            status: input.status,
            hours_worked: input.hours_worked || null,
          })
          .select()
          .single()
        if (error) throw error
        return data as Attendance
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}
