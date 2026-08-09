import { useMemo, useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import {
  usePayroll,
  useGeneratePayroll,
  useUpdatePayroll,
  useDeletePayroll,
} from '@/lib/queries/usePayroll'
import { useEmployees } from '@/lib/queries/useEmployees'
import { useDepartments } from '@/lib/queries/useDepartments'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import type { PayrollWithEmployee } from '@/types/database.types'

export function PayrollPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const isManager = role === 'manager'

  const todayStr = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const { data: payrollList, isLoading } = usePayroll()
  const { data: employees } = useEmployees()
  const { data: departments } = useDepartments()

  const generatePayroll = useGeneratePayroll()
  const updatePayroll = useUpdatePayroll()
  const deletePayroll = useDeletePayroll()

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Generate Payroll Modal State (Admin Only)
  const [genModalOpen, setGenModalOpen] = useState(false)
  const [genTargetType, setGenTargetType] = useState<'all' | 'department' | 'employee'>('all')
  const [genDeptId, setGenDeptId] = useState<number | ''>('')
  const [genEmpId, setGenEmpId] = useState<number | ''>('')
  const [periodStart, setPeriodStart] = useState(firstOfMonth)
  const [periodEnd, setPeriodEnd] = useState(todayStr)
  const [grossPay, setGrossPay] = useState('5000')
  const [deductionPercent, setDeductionPercent] = useState('10')
  const [payDate, setPayDate] = useState(todayStr)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending')

  // Payslip Modal State (View)
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollWithEmployee | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PayrollWithEmployee | null>(null)

  // Calculated Net Pay for Generate Modal
  const calculatedNetPay = useMemo(() => {
    const g = parseFloat(grossPay) || 0
    const d = parseFloat(deductionPercent) || 0
    const net = g * (1 - d / 100)
    return Math.max(0, parseFloat(net.toFixed(2)))
  }, [grossPay, deductionPercent])

  // Live Input Validation Rules
  const periodError = useMemo(() => {
    if (!periodStart || !periodEnd) return 'Period start and end dates are required.'
    if (periodEnd < periodStart) return 'Period end date cannot be earlier than start date.'
    return null
  }, [periodStart, periodEnd])

  const grossError = useMemo(() => {
    const g = parseFloat(grossPay)
    if (isNaN(g) || g <= 0) return 'Gross pay must be a positive number.'
    return null
  }, [grossPay])

  const targetError = useMemo(() => {
    if (genTargetType === 'department' && !genDeptId) return 'Please select a department.'
    if (genTargetType === 'employee' && !genEmpId) return 'Please select an employee.'
    return null
  }, [genTargetType, genDeptId, genEmpId])

  const isFormValid = !periodError && !grossError && !targetError && !!payDate

  // Filtered List
  const filtered = useMemo(() => {
    if (!payrollList) return []
    return payrollList.filter((p) => {
      const empName = p.employee ? `${p.employee.first_name} ${p.employee.last_name} ${p.employee.email}`.toLowerCase() : ''
      const matchesSearch = !search || empName.includes(search.toLowerCase())
      const matchesDept = departmentFilter === 'all' || String(p.employee?.department_id) === departmentFilter
      const matchesStatus = statusFilter === 'all' || p.payment_status === statusFilter
      return matchesSearch && matchesDept && matchesStatus
    })
  }, [payrollList, search, departmentFilter, statusFilter])

  // Summary Metrics
  const totalExpense = useMemo(() => {
    if (!payrollList) return 0
    return payrollList.reduce((acc, p) => acc + (p.net_pay || 0), 0)
  }, [payrollList])

  const paidCount = useMemo(() => payrollList?.filter((p) => p.payment_status === 'paid').length ?? 0, [payrollList])
  const pendingCount = useMemo(() => payrollList?.filter((p) => p.payment_status === 'pending').length ?? 0, [payrollList])
  const avgSalary = useMemo(() => {
    if (!payrollList || payrollList.length === 0) return 0
    return Math.round(totalExpense / payrollList.length)
  }, [payrollList, totalExpense])

  function openGenerateModal() {
    setGenTargetType('all')
    setGenDeptId('')
    setGenEmpId('')
    setPeriodStart(firstOfMonth)
    setPeriodEnd(todayStr)
    setGrossPay('5000')
    setDeductionPercent('10')
    setPayDate(todayStr)
    setPaymentStatus('pending')
    setGenModalOpen(true)
  }

  async function handleGenerateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid) return

    await generatePayroll.mutateAsync({
      period_start: periodStart,
      period_end: periodEnd,
      department_id: genTargetType === 'department' ? Number(genDeptId) : null,
      employee_id: genTargetType === 'employee' ? Number(genEmpId) : null,
      gross_pay: parseFloat(grossPay),
      net_pay: calculatedNetPay,
      deduction_percent: parseFloat(deductionPercent) || 0,
      pay_date: payDate,
      payment_status: paymentStatus,
    })
    setGenModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Role Access Scope Notice Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-surface-alt p-5 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Payroll & Compensation
            </h2>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            {isAdmin && '👑 Admin Access: Full Payroll Generation, Edits & Disbursement Control.'}
            {isManager && '🧭 Manager Access: Read-only Department Payroll Overview.'}
            {role === 'employee' && '🙂 Employee Access: Personal Payslip & Payment History.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openGenerateModal}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover shadow-sm"
          >
            ➕ Generate Payroll
          </button>
        )}
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard emoji="💵" label="Total Payroll Expense" value={`$${totalExpense.toLocaleString()}`} />
        <StatCard emoji="✅" label="Disbursed Payslips" value={isLoading ? '…' : paidCount} />
        <StatCard emoji="⏳" label="Pending Payments" value={isLoading ? '…' : pendingCount} />
        <StatCard emoji="📈" label="Average Net Salary" value={`$${avgSalary.toLocaleString()}`} />
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

          {(isAdmin || isManager) && (
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
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="all">All Payment Statuses</option>
            <option value="pending">⏳ Pending</option>
            <option value="paid">💵 Paid</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Pay Period</th>
              <th className="px-4 py-3 font-medium">Gross Salary</th>
              <th className="px-4 py-3 font-medium">Net Disbursed</th>
              <th className="px-4 py-3 font-medium">Pay Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  ⏳ Loading payroll records…
                </td>
              </tr>
            )}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  🕵️ No payroll records found.
                </td>
              </tr>
            )}

            {filtered.map((item) => (
              <tr
                key={item.payroll_id}
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
                <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                  {item.period_start} → {item.period_end}
                </td>
                <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  ${Number(item.gross_pay).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                  ${Number(item.net_pay).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{item.pay_date ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge value={item.payment_status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPayslip(item)}
                      title="View Payslip"
                      className="rounded-lg px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      📄 Payslip
                    </button>
                    {isAdmin && item.payment_status === 'pending' && (
                      <button
                        onClick={() => updatePayroll.mutate({ payroll_id: item.payroll_id, payment_status: 'paid' })}
                        disabled={updatePayroll.isPending}
                        title="Mark as Paid"
                        className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        ✅
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setConfirmDelete(item)}
                        title="Delete Record"
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Generate Payroll Modal (Admin Only) with Live Validation */}
      {isAdmin && (
        <Modal open={genModalOpen} onClose={() => setGenModalOpen(false)} title="➕ Generate Payroll Batch">
          <form onSubmit={handleGenerateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Target Recipients</label>
              <div className="mt-1 flex gap-4 text-sm">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={genTargetType === 'all'}
                    onChange={() => setGenTargetType('all')}
                  />
                  <span>All Active Employees</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={genTargetType === 'department'}
                    onChange={() => setGenTargetType('department')}
                  />
                  <span>Department</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={genTargetType === 'employee'}
                    onChange={() => setGenTargetType('employee')}
                  />
                  <span>Single Employee</span>
                </label>
              </div>
            </div>

            {genTargetType === 'department' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Select Department</label>
                <select
                  value={genDeptId}
                  onChange={(e) => setGenDeptId(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                  required
                >
                  <option value="">Choose Department</option>
                  {departments?.map((d) => (
                    <option key={d.department_id} value={d.department_id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {genTargetType === 'employee' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Select Employee</label>
                <select
                  value={genEmpId}
                  onChange={(e) => setGenEmpId(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                  required
                >
                  <option value="">Choose Employee</option>
                  {employees?.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.first_name} {emp.last_name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Period Start</label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Period End</label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                  required
                />
              </div>
            </div>
            {periodError && <p className="text-xs text-red-500">{periodError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Gross Salary ($)</label>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={grossPay}
                  onChange={(e) => setGrossPay(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                  required
                />
                {grossError && <p className="text-xs text-red-500 mt-0.5">{grossError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Deduction / Tax (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={deductionPercent}
                  onChange={(e) => setDeductionPercent(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
            </div>

            {/* Calculated Net Pay Highlight */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="flex justify-between items-center text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                <span>Calculated Net Salary:</span>
                <span className="text-base font-bold">${calculatedNetPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Pay Date</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="paid">💵 Paid</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setGenModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid || generatePayroll.isPending}
                className={`rounded-lg px-5 py-2 text-sm font-medium text-white transition-all ${
                  isFormValid
                    ? 'bg-primary hover:bg-primary-hover shadow-sm'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 dark:bg-gray-800 dark:text-gray-500'
                }`}
              >
                {generatePayroll.isPending ? '⏳ Processing…' : 'Generate Records'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payslip Viewer Modal */}
      {selectedPayslip && (
        <Modal open={true} onClose={() => setSelectedPayslip(null)} title="📄 Official Employee Payslip">
          <div className="space-y-6 p-2">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-4 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Nexgen EMS Corp.</h2>
                <p className="text-xs text-gray-500">Employee Payroll Statement</p>
              </div>
              <Badge value={selectedPayslip.payment_status} />
            </div>

            {/* Employee Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold">Employee</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedPayslip.employee ? `${selectedPayslip.employee.first_name} ${selectedPayslip.employee.last_name}` : 'Unknown'}
                </p>
                <p className="text-xs text-gray-500">{selectedPayslip.employee?.job_title ?? 'Employee'}</p>
                <p className="text-xs text-gray-400">{selectedPayslip.employee?.email}</p>
              </div>

              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold">Pay Period & Date</span>
                <p className="font-mono text-xs text-gray-800 dark:text-gray-200">
                  {selectedPayslip.period_start} → {selectedPayslip.period_end}
                </p>
                <p className="text-xs text-gray-500 mt-1">Disbursement Date: {selectedPayslip.pay_date ?? '—'}</p>
                <p className="text-xs text-gray-500">Department: {selectedPayslip.employee?.department?.name ?? '—'}</p>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="rounded-xl border border-gray-200 bg-surface-alt p-4 dark:border-gray-800">
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Earnings & Deductions Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Gross Salary</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    ${Number(selectedPayslip.gross_pay).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 border-b border-gray-200 pb-2 dark:border-gray-800">
                  <span>Deductions / Statutory Taxes</span>
                  <span>
                    -${Number(selectedPayslip.gross_pay - selectedPayslip.net_pay).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Net Disbursed Amount</span>
                  <span>${Number(selectedPayslip.net_pay).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              >
                🖨️ Print Payslip
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-xl dark:border-gray-800">
            <h3 className="mb-2 text-lg font-semibold text-red-600">🗑️ Delete Payroll Record?</h3>
            <p className="mb-4 text-sm text-gray-500">
              Delete payroll record for <strong>{confirmDelete.employee?.first_name} {confirmDelete.employee?.last_name}</strong> (${confirmDelete.net_pay})?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deletePayroll.mutateAsync(confirmDelete.payroll_id)
                  setConfirmDelete(null)
                }}
                disabled={deletePayroll.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletePayroll.isPending ? '⏳ Deleting…' : 'Delete Record'}
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
