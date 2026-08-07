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

export interface UserPreferences {
  employee_id: number
  theme_mode: 'light' | 'dark'
  accent_color: AccentColor
}

// Minimal shape so the Supabase client generic compiles.
// Extend with the rest of the tables as we build each feature.
export interface Database {
  public: {
    Tables: {
      employee: { Row: Employee; Insert: Partial<Employee>; Update: Partial<Employee> }
      department: { Row: Department; Insert: Partial<Department>; Update: Partial<Department> }
      user_preferences: {
        Row: UserPreferences
        Insert: Partial<UserPreferences>
        Update: Partial<UserPreferences>
      }
    }
  }
}
