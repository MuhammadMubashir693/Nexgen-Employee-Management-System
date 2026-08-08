import { useMemo, useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { useAuditLogs } from '@/lib/queries/useAuditLog'
import { Modal } from '@/components/ui/Modal'
import type { AuditLogWithActor } from '@/types/database.types'

export function AuditLogPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')

  const { data: logs, isLoading } = useAuditLogs({
    action: actionFilter,
    entityType: entityFilter,
    search,
  })

  // Selected Log for JSON / Diff Inspection
  const [selectedLog, setSelectedLog] = useState<AuditLogWithActor | null>(null)

  // Metrics
  const insertCount = useMemo(() => logs?.filter((l) => l.action === 'INSERT').length ?? 0, [logs])
  const updateCount = useMemo(() => logs?.filter((l) => l.action === 'UPDATE').length ?? 0, [logs])
  const deleteCount = useMemo(() => logs?.filter((l) => l.action === 'DELETE').length ?? 0, [logs])

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/50 p-12 text-center dark:border-amber-900/50 dark:bg-amber-950/20">
        <span className="text-4xl mb-3">🛡️</span>
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-300">Access Restricted</h2>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-400 max-w-md">
          The System Audit Log contains confidential enterprise activity records and is restricted to Administrators only.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>📜</span> System Audit Log
        </h2>
        <p className="text-sm text-gray-500">
          Track system activity, user actions, data mutations, and entity history across the platform.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard emoji="📊" label="Total Audited Events" value={isLoading ? '…' : logs?.length ?? 0} />
        <StatCard emoji="➕" label="Created Records" value={isLoading ? '…' : insertCount} />
        <StatCard emoji="✏️" label="Updated Records" value={isLoading ? '…' : updateCount} />
        <StatCard emoji="🗑️" label="Deleted Records" value={isLoading ? '…' : deleteCount} />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actor or entity…"
              className="rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="all">All Actions</option>
            <option value="INSERT">➕ INSERT</option>
            <option value="UPDATE">✏️ UPDATE</option>
            <option value="DELETE">🗑️ DELETE</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="all">All Entities</option>
            <option value="employee">👥 Employee</option>
            <option value="department">🏢 Department</option>
            <option value="project">📁 Project</option>
            <option value="leaves">🌴 Leaves</option>
            <option value="payroll">💰 Payroll</option>
            <option value="attendance">🕒 Attendance</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 font-medium">Log ID</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity Type</th>
              <th className="px-4 py-3 font-medium">Entity ID</th>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  ⏳ Loading audit trail…
                </td>
              </tr>
            )}

            {!isLoading && logs?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  🕵️ No audit logs found.
                </td>
              </tr>
            )}

            {logs?.map((log) => (
              <tr
                key={log.audit_log_id}
                className="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/40"
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-500">#{log.audit_log_id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {log.actor ? `${log.actor.first_name} ${log.actor.last_name}` : 'System / Automated'}
                  </div>
                  <div className="text-xs text-gray-400">{log.actor?.email ?? '—'}</div>
                </td>
                <td className="px-4 py-3">
                  <ActionBadge action={log.action} />
                </td>
                <td className="px-4 py-3 font-medium capitalize text-gray-700 dark:text-gray-300">
                  {log.entity_type}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {log.entity_id ?? '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {new Date(log.changed_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    🔍 Inspect Diff
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Diff Inspector Modal */}
      {selectedLog && (
        <Modal open={true} onClose={() => setSelectedLog(null)} title={`🔍 Audit Log Event #${selectedLog.audit_log_id}`}>
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 text-xs rounded-xl bg-gray-50 p-3 dark:bg-gray-900/50">
              <div>
                <span className="text-gray-400 font-semibold uppercase">Actor</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedLog.actor ? `${selectedLog.actor.first_name} ${selectedLog.actor.last_name}` : 'System'}
                </p>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase">Timestamp</span>
                <p className="font-mono text-gray-800 dark:text-gray-200">
                  {new Date(selectedLog.changed_at).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase">Entity & ID</span>
                <p className="font-medium capitalize text-gray-800 dark:text-gray-200">
                  {selectedLog.entity_type} (#{selectedLog.entity_id ?? 'N/A'})
                </p>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase">Action Type</span>
                <div className="mt-0.5">
                  <ActionBadge action={selectedLog.action} />
                </div>
              </div>
            </div>

            {/* Comparison Views */}
            <div className="space-y-3">
              {selectedLog.old_values && (
                <div>
                  <h4 className="text-xs font-semibold text-red-500 uppercase mb-1">Previous Values (Before)</h4>
                  <pre className="rounded-xl border border-gray-200 bg-gray-900 p-3 font-mono text-xs text-red-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <h4 className="text-xs font-semibold text-emerald-500 uppercase mb-1">New Values (After)</h4>
                  <pre className="rounded-xl border border-gray-200 bg-gray-900 p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {!selectedLog.old_values && !selectedLog.new_values && (
                <p className="text-xs text-gray-400 text-center py-4">No detailed payload captured for this action.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    INSERT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    DELETE: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[action] ?? 'bg-gray-100 text-gray-700'}`}>
      {action === 'INSERT' && '➕'}
      {action === 'UPDATE' && '✏️'}
      {action === 'DELETE' && '🗑️'}
      {action}
    </span>
  )
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-surface-alt p-5 dark:border-gray-800">
      <div className="mb-2 text-2xl">{emoji}</div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  )
}
