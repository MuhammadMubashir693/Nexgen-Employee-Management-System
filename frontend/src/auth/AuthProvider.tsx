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
      // Supabase fires onAuthStateChange (e.g. TOKEN_REFRESHED) whenever the
      // tab regains focus/visibility, not just on real sign-in/sign-out. If
      // we flip `loading` back to true here, ProtectedRoute unmounts the
      // whole page (including any in-progress form) every time the admin
      // switches tabs and back. Only show the full-page loader for an
      // actual identity change; otherwise just refresh state quietly.
      setSession((prevSession) => {
        const userChanged = prevSession?.user?.id !== newSession?.user?.id
        if (!newSession?.user) {
          setEmployee(null)
        } else if (userChanged) {
          setLoading(true)
          loadEmployee(newSession.user.id).finally(() => setLoading(false))
        } else {
          // Same user — refresh employee data in background if needed without unmounting UI
          loadEmployee(newSession.user.id)
        }
        return newSession
      })
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
