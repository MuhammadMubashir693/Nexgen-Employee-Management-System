// Types definition for Supabase Database Schema

export type UserRole = 'admin' | 'manager' | 'employee'
export type AccentColor = 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'yellow'

export interface Employee {
  employee_id: number
  auth_user_id: string | null
  department_id: number | null
  manager_employee_id: number | null
  first_name: string
  last_name: string
  gender: 'M' | 'F' | null
  email: string
  hire_date: string
  job_title: string | null
  status: 'active' | 'on_leave' | 'terminated'
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Department {
  department_id: number
  name: string
  location: string | null
  manager_id: number | null
}

export interface Project {
  project_id: number
  department_id: number | null
  manager_id: number | null
  project_name: string
  start_date: string | null
  end_date: string | null
  budget: number | null
  status: 'active' | 'completed' | 'on_hold' | 'cancelled'
}

export interface Assignment {
  employee_id: number
  project_id: number
  assigned_role: string | null
  assigned_at: string
}

export interface Attendance {
  attendance_id: number
  employee_id: number
  attendance_date: string
  check_in: string | null
  check_out: string | null
  status: 'present' | 'absent' | 'late' | 'half_day'
  hours_worked: number | null
}

export interface Leave {
  leave_id: number
  employee_id: number
  leave_type: 'sick' | 'family' | 'wedding' | 'funeral' | 'casual' | 'unpaid' | 'annual'
  start_date: string
  end_date: string
  reason: string | null
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_by: number | null
  requested_at: string
}

export interface Payroll {
  payroll_id: number
  employee_id: number
  period_start: string
  period_end: string
  gross_pay: number
  net_pay: number
  pay_date: string | null
  payment_status: 'pending' | 'paid'
}

export interface AuditLog {
  audit_log_id: number
  actor_employee_id: number | null
  entity_type: string
  entity_id: number | null
  action: string
  changed_at: string
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
}

export interface UserPreferences {
  employee_id: number
  theme_mode: 'light' | 'dark'
  accent_color: AccentColor
}

// Relational Interface Types for UI components
export interface EmployeeWithDepartment extends Employee {
  department: Pick<Department, 'department_id' | 'name'> | null
}

export interface ProjectWithRelations extends Project {
  department: Pick<Department, 'department_id' | 'name'> | null
  manager: Pick<Employee, 'employee_id' | 'first_name' | 'last_name'> | null
  assignments: Array<
    Pick<Assignment, 'employee_id' | 'assigned_role'> & {
      employee: Pick<Employee, 'employee_id' | 'first_name' | 'last_name'>
    }
  >
}

export interface AttendanceWithEmployee extends Attendance {
  employee: Pick<Employee, 'employee_id' | 'first_name' | 'last_name' | 'email' | 'department_id'> & {
    department?: Pick<Department, 'department_id' | 'name'> | null
  }
}

export interface LeaveWithRelations extends Leave {
  employee: Pick<Employee, 'employee_id' | 'first_name' | 'last_name' | 'email' | 'department_id'> & {
    department?: Pick<Department, 'department_id' | 'name'> | null
  }
  approver?: Pick<Employee, 'employee_id' | 'first_name' | 'last_name'> | null
}

export interface PayrollWithEmployee extends Payroll {
  employee: Pick<Employee, 'employee_id' | 'first_name' | 'last_name' | 'email' | 'job_title' | 'department_id'> & {
    department?: Pick<Department, 'department_id' | 'name'> | null
  }
}

export interface AuditLogWithActor extends AuditLog {
  actor?: Pick<Employee, 'employee_id' | 'first_name' | 'last_name' | 'email' | 'role'> | null
}

export interface Database {
  public: {
    Tables: {
      employee: {
        Row: Employee
        Insert: Partial<Employee>
        Update: Partial<Employee>
        Relationships: []
      }
      department: {
        Row: Department
        Insert: Partial<Department>
        Update: Partial<Department>
        Relationships: []
      }
      project: {
        Row: Project
        Insert: Partial<Project>
        Update: Partial<Project>
        Relationships: []
      }
      assignment: {
        Row: Assignment
        Insert: Partial<Assignment>
        Update: Partial<Assignment>
        Relationships: []
      }
      attendance: {
        Row: Attendance
        Insert: Partial<Attendance>
        Update: Partial<Attendance>
        Relationships: []
      }
      leaves: {
        Row: Leave
        Insert: Partial<Leave>
        Update: Partial<Leave>
        Relationships: []
      }
      payroll: {
        Row: Payroll
        Insert: Partial<Payroll>
        Update: Partial<Payroll>
        Relationships: []
      }
      audit_log: {
        Row: AuditLog
        Insert: Partial<AuditLog>
        Update: Partial<AuditLog>
        Relationships: []
      }
      user_preferences: {
        Row: UserPreferences
        Insert: Partial<UserPreferences>
        Update: Partial<UserPreferences>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
