import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Employee } from '@/types/database.types'

interface AuthContextValue {
  loading: boolean
  session: import('@supabase/supabase-js').Session | null
  employee: Employee | null
  role: Employee['role'] | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadEmployee(userId: string) {
    const { data, error } = await supabase
      .from('employee')
      .select('*')
      .eq('auth_user_id', userId)
      .single()

    if (error) {
      console.error('Failed to load employee profile:', error.message)
      setEmployee(null)
      return
    }
    setEmployee(data as Employee)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        loadEmployee(data.session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        setLoading(true)
        loadEmployee(newSession.user.id).finally(() => setLoading(false))
      } else {
        setEmployee(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ loading, session, employee, role: employee?.role ?? null, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
