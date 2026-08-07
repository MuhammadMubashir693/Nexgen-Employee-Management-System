import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/auth/AuthProvider'
import type { AccentColor } from '@/types/database.types'

export const ACCENT_OPTIONS: { value: AccentColor; label: string; emoji: string }[] = [
  { value: 'red', label: 'Red', emoji: '🔴' },
  { value: 'blue', label: 'Blue', emoji: '🔵' },
  { value: 'green', label: 'Green', emoji: '🟢' },
  { value: 'purple', label: 'Purple', emoji: '🟣' },
  { value: 'orange', label: 'Orange', emoji: '🟠' },
  { value: 'yellow', label: 'Yellow', emoji: '🟡' },
]

interface ThemeContextValue {
  mode: 'light' | 'dark'
  accent: AccentColor
  setMode: (mode: 'light' | 'dark') => void
  setAccent: (accent: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { employee } = useAuth()
  const [mode, setModeState] = useState<'light' | 'dark'>('light')
  const [accent, setAccentState] = useState<AccentColor>('blue')

  // Apply to <html> whenever mode/accent change
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    root.setAttribute('data-accent', accent)
  }, [mode, accent])

  // Load saved preference once we know who's logged in
  useEffect(() => {
    if (!employee) return
    supabase
      .from('user_preferences')
      .select('*')
      .eq('employee_id', employee.employee_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setModeState(data.theme_mode)
          setAccentState(data.accent_color)
        }
      })
  }, [employee])

  async function persist(next: Partial<{ theme_mode: 'light' | 'dark'; accent_color: AccentColor }>) {
    if (!employee) return
    await supabase.from('user_preferences').upsert({
      employee_id: employee.employee_id,
      theme_mode: next.theme_mode ?? mode,
      accent_color: next.accent_color ?? accent,
    })
  }

  function setMode(next: 'light' | 'dark') {
    setModeState(next)
    persist({ theme_mode: next })
  }

  function setAccent(next: AccentColor) {
    setAccentState(next)
    persist({ accent_color: next })
  }

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
