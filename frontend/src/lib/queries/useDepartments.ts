import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Department } from '@/types/database.types'

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('department').select('*').order('name')
      if (error) throw error
      return data as Department[]
    },
  })
}
