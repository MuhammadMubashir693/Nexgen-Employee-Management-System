import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

/** Upload a new profile picture. Calls the manage-avatar edge function. */
export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Not authenticated')

      const formData = new FormData()
      formData.append('avatar', file)

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const res = await fetch(`${supabaseUrl}/functions/v1/manage-avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Upload failed')
      return json as { success: true; avatar_url: string }
    },
    onSuccess: () => {
      // Invalidate the employee cache so AuthProvider re-fetches the updated avatar_url
      queryClient.invalidateQueries({ queryKey: ['employee'] })
    },
  })
}

/** Remove the current profile picture. Calls the manage-avatar edge function. */
export function useRemoveAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Not authenticated')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const res = await fetch(`${supabaseUrl}/functions/v1/manage-avatar`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Remove failed')
      return json as { success: true; avatar_url: null }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee'] })
    },
  })
}
