import { useMemo, useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import {
  useAttendance,
  useTodayAttendance,
  useCheckIn,
  useCheckOut,
  useRecordAttendance,
} from '@/lib/queries/useAttendance'
import { useEmployees } from '@/lib/queries/useEmployees'
import { useDepartments } from '@/lib/queries/useDepartments'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import type { AttendanceWithEmployee } from '@/types/database.types'

export function AttendancePage() {
  const { employee, role } = useAuth()
  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const canManage = isAdmin || isManager

  // Managers may only manage attendance for employees in their own department.
  const managerDepartmentId = isManager ? employee?.department_id : null

  const todayStr = new Date().toISOString().split('T')[0]

  const { data: todayRecord, isLoading: loadingToday } = useTodayAttendance(employee?.employee_id)
  const { data: attendanceList, isLoading } = useAttendance()
  const { data: employees } = useEmployees()
  const { data: departments } = useDepartments()

  // Restrict the employee list available to managers to their own department.
  const manageableEmployees = useMemo(() => {
    if (!employees) return []
    if (!isManager || managerDepartmentId == null) return employees

    return employees.filter(
      (emp) => emp.department_id === managerDepartmentId
    )
  }, [employees, isManager, managerDepartmentId])

  const checkIn = useCheckIn()
  const checkOut = useCheckOut()
  const recordAttendance = useRecordAttendance()

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AttendanceWithEmployee | null>(null)
  const [modalEmpId, setModalEmpId] = useState<number | ''>('')
  const [modalDate, setModalDate] = useState(todayStr)
  const [modalCheckIn, setModalCheckIn] = useState('09:00')
  const [modalCheckOut, setModalCheckOut] = useState('17:00')
  const [modalStatus, setModalStatus] = useState<'present' | 'absent' | 'late' | 'half_day'>('present')
  const [modalHours, setModalHours] = useState<string>('8.00')

  // Filtered List
  const filtered = useMemo(() => {
    if (!attendanceList) return []

    return attendanceList.filter((row) => {
      // Managers can only see/manage attendance belonging to their department.
      if (
        isManager &&
        (managerDepartmentId == null ||
          row.employee?.department_id !== managerDepartmentId)
      ) {
        return false
      }

      const empName = row.employee
        ? `${row.employee.first_name} ${row.employee.last_name} ${row.employee.email}`.toLowerCase()
        : ''
      const matchesSearch = !search || empName.includes(search.toLowerCase())

      const matchesDept =
        isManager
          ? row.employee?.department_id === managerDepartmentId
          : departmentFilter === 'all' ||
          String(row.employee?.department_id) === departmentFilter

      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      const matchesDate = !dateFilter || row.attendance_date === dateFilter

      return matchesSearch && matchesDept && matchesStatus && matchesDate
    })
  }, [
    attendanceList,
    search,
    departmentFilter,
    statusFilter,
    dateFilter,
    isManager,
    managerDepartmentId,
  ])

  // Summary Metrics
  const presentToday = useMemo(() => {
    if (!attendanceList) return 0
    return attendanceList.filter((a) => a.attendance_date === todayStr && (a.status === 'present' || a.status === 'late')).length
  }, [attendanceList, todayStr])

  const lateToday = useMemo(() => {
    if (!attendanceList) return 0
    return attendanceList.filter((a) => a.attendance_date === todayStr && a.status === 'late').length
  }, [attendanceList, todayStr])

  const absentToday = useMemo(() => {
    if (!attendanceList) return 0
    return attendanceList.filter((a) => a.attendance_date === todayStr && a.status === 'absent').length
  }, [attendanceList, todayStr])

  function openAddModal() {
    setEditingItem(null)
    setModalEmpId(employee?.employee_id || '')
    setModalDate(todayStr)
    setModalCheckIn('09:00')
    setModalCheckOut('17:00')
    setModalStatus('present')
    setModalHours('8.00')
    setModalOpen(true)
  }

  function openEditModal(item: AttendanceWithEmployee) {
    setEditingItem(item)
    setModalEmpId(item.employee_id)
    setModalDate(item.attendance_date)
    setModalCheckIn(item.check_in ? item.check_in.slice(0, 5) : '09:00')
    setModalCheckOut(item.check_out ? item.check_out.slice(0, 5) : '17:00')
    setModalStatus(item.status)
    setModalHours(item.hours_worked ? String(item.hours_worked) : '8.00')
    setModalOpen(true)
  }

  // Live Modal Form Validation
  const isModalValid = modalEmpId !== '' && modalDate.trim() !== '' && modalStatus !== undefined

  async function handleSaveAttendance(e: React.FormEvent) {
    e.preventDefault()
    if (!isModalValid) return

    // Never allow a manager to submit attendance for another department,
    // even if the employee ID is manually manipulated in the browser.
    if (isManager && managerDepartmentId != null) {
      const selectedEmployee = manageableEmployees.find(
        (emp) => emp.employee_id === Number(modalEmpId)
      )

      if (
        !selectedEmployee ||
        selectedEmployee.department_id !== managerDepartmentId
      ) {
        return
      }
    }

    await recordAttendance.mutateAsync({
      attendance_id: editingItem?.attendance_id,
      employee_id: Number(modalEmpId),
      attendance_date: modalDate,
      check_in: modalCheckIn ? `${modalCheckIn}:00` : null,
      check_out: modalCheckOut ? `${modalCheckOut}:00` : null,
      status: modalStatus,
      hours_worked: modalHours ? Number(modalHours) : null,
    })
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Employee Quick Check-In / Check-Out Hero Widget */}
      <div className="rounded-2xl border border-gray-200 bg-surface-alt p-6 shadow-sm dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🕒</span>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Daily Attendance Desk
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Today: <strong>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {loadingToday ? (
              <span className="text-sm text-gray-400">Loading today's status…</span>
            ) : !todayRecord ? (
              <button
                onClick={() => employee && checkIn.mutate(employee.employee_id)}
                disabled={checkIn.isPending || !employee}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
              >
                {checkIn.isPending ? '⏳ Checking In…' : '🟢 Check In Now'}
              </button>
            ) : !todayRecord.check_out ? (
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Checked In at {todayRecord.check_in?.slice(0, 5)}
                </span>
                <button
                  onClick={() =>
                    checkOut.mutate({
                      attendanceId: todayRecord.attendance_id,
                      checkInTime: todayRecord.check_in,
                    })
                  }
                  disabled={checkOut.isPending}
                  className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amber-700 disabled:opacity-50"
                >
                  {checkOut.isPending ? '⏳ Checking Out…' : '🔴 Check Out'}
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                ✅ Shift Completed ({todayRecord.check_in?.slice(0, 5)} – {todayRecord.check_out?.slice(0, 5)} • {todayRecord.hours_worked ?? '8.0'} hrs)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard emoji="🟢" label="Present Today" value={isLoading ? '…' : presentToday} />
        <StatCard emoji="⏰" label="Late Arrivals" value={isLoading ? '…' : lateToday} />
        <StatCard emoji="🔴" label="Absent Today" value={isLoading ? '…' : absentToday} />
        <StatCard emoji="📊" label="Total Attendance Logs" value={isLoading ? '…' : attendanceList?.length ?? 0} />
      </div>

      {/* Controls & Filter Bar */}
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
            value={
              isManager && managerDepartmentId != null
                ? String(managerDepartmentId)
                : departmentFilter
            }
            onChange={(e) => setDepartmentFilter(e.target.value)}
            disabled={isManager}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-900"
          >
            {isManager ? (
              departments
                ?.filter((d) => d.department_id === managerDepartmentId)
                .map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    🏢 {d.name}
                  </option>
                ))
            ) : (
              <>
                <option value="all">🏢 All Departments</option>
                {departments?.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.name}
                  </option>
                ))}
              </>
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="all">All Statuses</option>
            <option value="present">🟢 Present</option>
            <option value="late">⏰ Late</option>
            <option value="absent">🔴 Absent</option>
            <option value="half_day">🌓 Half Day</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear Date
            </button>
          )}
        </div>

        {canManage && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            ➕ Manual Attendance Log
          </button>
        )}
      </div>

      {/* Main Data Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Check In</th>
              <th className="px-4 py-3 font-medium">Check Out</th>
              <th className="px-4 py-3 font-medium">Hours Worked</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canManage && <th className="px-4 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  ⏳ Loading attendance records…
                </td>
              </tr>
            )}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  🕵️ No attendance logs match your filters.
                </td>
              </tr>
            )}

            {filtered.map((item) => (
              <tr
                key={item.attendance_id}
                className="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/40"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : 'Unknown Employee'}
                  </div>
                  <div className="text-xs text-gray-400">{item.employee?.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {item.employee?.department?.name ?? '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{item.attendance_date}</td>
                <td className="px-4 py-3 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                  {item.check_in ? item.check_in.slice(0, 5) : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-amber-600 dark:text-amber-400">
                  {item.check_out ? item.check_out.slice(0, 5) : '—'}
                </td>
                <td className="px-4 py-3 font-medium">
                  {item.hours_worked ? `${item.hours_worked} hrs` : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge value={item.status} />
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEditModal(item)}
                      title="Edit Log"
                      className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      ✏️
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Attendance Modal */}
      {canManage && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? '✏️ Edit Attendance Record' : '➕ Manual Attendance Log'}
        >
          <form onSubmit={handleSaveAttendance} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Employee</label>
              <select
                value={modalEmpId}
                onChange={(e) => setModalEmpId(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                required
              >
                <option value="">Select Employee</option>
                {manageableEmployees.map((emp) => (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {emp.first_name} {emp.last_name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Date</label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Status</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                  required
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Check In</label>
                <input
                  type="time"
                  value={modalCheckIn}
                  onChange={(e) => setModalCheckIn(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Check Out</label>
                <input
                  type="time"
                  value={modalCheckOut}
                  onChange={(e) => setModalCheckOut(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Hours Worked</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  value={modalHours}
                  onChange={(e) => setModalHours(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
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
                disabled={!isModalValid || recordAttendance.isPending}
                className={`rounded-lg px-5 py-2 text-sm font-medium text-white transition-all ${isModalValid
                    ? 'bg-primary hover:bg-primary-hover'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 dark:bg-gray-800 dark:text-gray-500'
                  }`}
              >
                {recordAttendance.isPending ? '⏳ Saving…' : 'Save Record'}
              </button>
            </div>
          </form>
        </Modal>
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
