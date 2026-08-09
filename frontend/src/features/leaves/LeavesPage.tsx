import { useMemo, useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import {
  useLeaves,
  useRequestLeave,
  useUpdateLeaveStatus,
  useCancelLeave,
} from '@/lib/queries/useLeaves'
import { useDepartments } from '@/lib/queries/useDepartments'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { pluralize } from '@/lib/utils'
import type { Leave, LeaveWithRelations } from '@/types/database.types'

export function LeavesPage() {
  const { employee, role } = useAuth()
  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const canApprove = isAdmin || isManager

  const todayStr = new Date().toISOString().split('T')[0]

  const { data: leaves, isLoading } = useLeaves()
  const { data: departments } = useDepartments()

  const requestLeave = useRequestLeave()
  const updateStatus = useUpdateLeaveStatus()
  const cancelLeave = useCancelLeave()

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Request Leave Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [leaveType, setLeaveType] = useState<Leave['leave_type']>('sick')
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(todayStr)
  const [reason, setReason] = useState('')

  // Action Confirmations
  const [confirmApprove, setConfirmApprove] = useState<LeaveWithRelations | null>(null)
  const [confirmReject, setConfirmReject] = useState<LeaveWithRelations | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<LeaveWithRelations | null>(null)

  // Filtered List
  const filtered = useMemo(() => {
    if (!leaves) return []
    return leaves.filter((l) => {
      const empName = l.employee ? `${l.employee.first_name} ${l.employee.last_name} ${l.employee.email}`.toLowerCase() : ''
      const matchesSearch = !search || empName.includes(search.toLowerCase())
      const matchesDept = departmentFilter === 'all' || String(l.employee?.department_id) === departmentFilter
      const matchesStatus = statusFilter === 'all' || l.approval_status === statusFilter
      const matchesType = typeFilter === 'all' || l.leave_type === typeFilter
      return matchesSearch && matchesDept && matchesStatus && matchesType
    })
  }, [leaves, search, departmentFilter, statusFilter, typeFilter])

  // Summary Metrics
  const pendingCount = useMemo(() => leaves?.filter((l) => l.approval_status === 'pending').length ?? 0, [leaves])
  const approvedCount = useMemo(() => leaves?.filter((l) => l.approval_status === 'approved').length ?? 0, [leaves])
  const sickCount = useMemo(() => leaves?.filter((l) => l.leave_type === 'sick').length ?? 0, [leaves])
  const annualCount = useMemo(() => leaves?.filter((l) => l.leave_type === 'annual' || l.leave_type === 'casual').length ?? 0, [leaves])

  // Live Input Validation Rules
  const dateError = useMemo(() => {
    if (!startDate || !endDate) return 'Start and End dates are required.'
    if (endDate < startDate) return 'End date cannot be earlier than start date.'
    return null
  }, [startDate, endDate])

  const reasonError = useMemo(() => {
    if (!reason.trim()) return 'Reason is required.'
    if (reason.trim().length < 5) return 'Reason must be at least 5 characters.'
    return null
  }, [reason])

  const isFormValid = !dateError && !reasonError && !!leaveType

  function openRequestModal() {
    setLeaveType('sick')
    setStartDate(todayStr)
    setEndDate(todayStr)
    setReason('')
    setModalOpen(true)
  }

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid || !employee) return

    await requestLeave.mutateAsync({
      employee_id: employee.employee_id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim(),
    })
    setModalOpen(false)
  }

  function calculateDays(start: string, end: string) {
    const s = new Date(start)
    const e = new Date(end)
    const diffTime = Math.abs(e.getTime() - s.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Header & Main Request Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🌴</span> Leave Management
          </h2>
          <p className="text-sm text-gray-500">
            Submit leave requests, track approvals, and view company time-off balance.
          </p>
        </div>

        <button
          onClick={openRequestModal}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover shadow-sm"
        >
          ➕ Request Leave
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard emoji="⏳" label="Pending Approvals" value={isLoading ? '…' : pendingCount} />
        <StatCard emoji="✅" label="Approved Requests" value={isLoading ? '…' : approvedCount} />
        <StatCard emoji="🤒" label="Sick Leaves" value={isLoading ? '…' : sickCount} />
        <StatCard emoji="🏖️" label="Annual & Casual" value={isLoading ? '…' : annualCount} />
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
              placeholder="Search employee…"
              className="rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="all">🏢 All Departments</option>
            {departments?.map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="all">All Statuses</option>
            <option value="pending">⏳ Pending</option>
            <option value="approved">✅ Approved</option>
            <option value="rejected">❌ Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="all">All Leave Types</option>
            <option value="sick">🤒 Sick</option>
            <option value="casual">🏖️ Casual</option>
            <option value="annual">📅 Annual</option>
            <option value="unpaid">💸 Unpaid</option>
          </select>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Leave Type</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Approved By</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  ⏳ Loading leave requests…
                </td>
              </tr>
            )}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  🕵️ No leave requests found.
                </td>
              </tr>
            )}

            {filtered.map((item) => {
              const days = calculateDays(item.start_date, item.end_date)
              const isSelf = employee?.employee_id === item.employee_id
              const isPending = item.approval_status === 'pending'

              return (
                <tr
                  key={item.leave_id}
                  className="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/40"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-400">{item.employee?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {item.employee?.department?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={item.leave_type} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-gray-700 dark:text-gray-300">
                      {item.start_date} → {item.end_date}
                    </div>
                    <div className="text-xs text-gray-400">{pluralize(days, 'day')}</div>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-gray-600 dark:text-gray-400" title={item.reason || ''}>
                    {item.reason || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={item.approval_status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {item.approver ? `${item.approver.first_name} ${item.approver.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {canApprove && isPending && !isSelf && (
                        <>
                          <button
                            onClick={() => setConfirmApprove(item)}
                            title="Approve"
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => setConfirmReject(item)}
                            title="Reject"
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            ❌
                          </button>
                        </>
                      )}
                      {isSelf && isPending && (
                        <button
                          onClick={() => setConfirmCancel(item)}
                          title="Cancel Request"
                          className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Request Leave Modal with Live Validation */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="🌴 Request Leave">
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as Leave['leave_type'])}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
              required
            >
              <option value="sick">🤒 Sick Leave</option>
              <option value="casual">🏖️ Casual Leave</option>
              <option value="annual">📅 Annual Leave</option>
              <option value="unpaid">💸 Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`mt-1 w-full rounded-lg border p-2.5 text-sm dark:bg-gray-900 ${
                  dateError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-700'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`mt-1 w-full rounded-lg border p-2.5 text-sm dark:bg-gray-900 ${
                  dateError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-700'
                }`}
                required
              />
            </div>
          </div>
          {dateError && <p className="text-xs text-red-500 mt-1">{dateError}</p>}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">Reason for Leave</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a clear explanation for your leave request…"
              className={`mt-1 w-full rounded-lg border p-2.5 text-sm dark:bg-gray-900 ${
                reasonError && reason.length > 0
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
              required
            />
            {reasonError && reason.length > 0 && (
              <p className="text-xs text-red-500 mt-1">{reasonError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || requestLeave.isPending}
              className={`rounded-lg px-5 py-2 text-sm font-medium text-white transition-all ${
                isFormValid
                  ? 'bg-primary hover:bg-primary-hover shadow-sm'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 dark:bg-gray-800 dark:text-gray-500'
              }`}
            >
              {requestLeave.isPending ? '⏳ Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialogs */}
      {confirmApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-xl dark:border-gray-800">
            <h3 className="mb-2 text-lg font-semibold text-emerald-600">✅ Approve Leave Request?</h3>
            <p className="mb-4 text-sm text-gray-500">
              Approve leave for <strong>{confirmApprove.employee?.first_name} {confirmApprove.employee?.last_name}</strong> from {confirmApprove.start_date} to {confirmApprove.end_date}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmApprove(null)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await updateStatus.mutateAsync({
                    leave_id: confirmApprove.leave_id,
                    decision: 'approved',
                    approved_by: employee?.employee_id,
                  })
                  setConfirmApprove(null)
                }}
                disabled={updateStatus.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {updateStatus.isPending ? '⏳ Working…' : 'Confirm Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-xl dark:border-gray-800">
            <h3 className="mb-2 text-lg font-semibold text-red-600">❌ Reject Leave Request?</h3>
            <p className="mb-4 text-sm text-gray-500">
              Reject leave request for <strong>{confirmReject.employee?.first_name} {confirmReject.employee?.last_name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmReject(null)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await updateStatus.mutateAsync({
                    leave_id: confirmReject.leave_id,
                    decision: 'rejected',
                    approved_by: employee?.employee_id,
                  })
                  setConfirmReject(null)
                }}
                disabled={updateStatus.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {updateStatus.isPending ? '⏳ Working…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-xl dark:border-gray-800">
            <h3 className="mb-2 text-lg font-semibold">Cancel Leave Request?</h3>
            <p className="mb-4 text-sm text-gray-500">
              Are you sure you want to cancel your leave request for {confirmCancel.start_date}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmCancel(null)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                No, Keep
              </button>
              <button
                onClick={async () => {
                  await cancelLeave.mutateAsync(confirmCancel.leave_id)
                  setConfirmCancel(null)
                }}
                disabled={cancelLeave.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelLeave.isPending ? '⏳ Cancelling…' : 'Yes, Cancel Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
