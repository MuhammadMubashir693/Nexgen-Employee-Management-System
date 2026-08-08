// This is a hand-written placeholder covering just what the app needs
// right now. Once your schema is finalized, replace this by running:
//   npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.types.ts
// which will keep this file in sync with the real Postgres schema automatically.

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

export interface ProjectWithRelations extends Project {
  department: Pick<Department, 'department_id' | 'name'> | null
  manager: Pick<Employee, 'employee_id' | 'first_name' | 'last_name'> | null
  assignments: Array<
    Pick<Assignment, 'employee_id' | 'assigned_role'> & {
      employee: Pick<Employee, 'employee_id' | 'first_name' | 'last_name'>
    }
  >
}

export interface EmployeeWithDepartment extends Employee {
  department: Pick<Department, 'department_id' | 'name'> | null
}

export interface UserPreferences {
  employee_id: number
  theme_mode: 'light' | 'dark'
  accent_color: AccentColor
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
