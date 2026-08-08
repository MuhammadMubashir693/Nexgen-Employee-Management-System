import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { AuditLogWithActor } from '@/types/database.types'

export function useAuditLogs(filters?: {
  action?: string
  entityType?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['audit_logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select(`
          *,
          actor:actor_employee_id(
            employee_id,
            first_name,
            last_name,
            email,
            role
          )
        `)
        .order('changed_at', { ascending: false })
        .limit(200)

      if (filters?.action && filters.action !== 'all') {
        query = query.eq('action', filters.action)
      }
      if (filters?.entityType && filters.entityType !== 'all') {
        query = query.eq('entity_type', filters.entityType)
      }

      const { data, error } = await query
      if (error) throw error

      let logs = (data || []) as unknown as AuditLogWithActor[]
      if (filters?.search) {
        const s = filters.search.toLowerCase()
        logs = logs.filter((log) => {
          const actorName = log.actor ? `${log.actor.first_name} ${log.actor.last_name} ${log.actor.email}`.toLowerCase() : 'system'
          const entity = (log.entity_type || '').toLowerCase()
          return actorName.includes(s) || entity.includes(s)
        })
      }

      return logs
    },
  })
}
