const STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  on_leave: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  terminated: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  employee: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  on_hold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  // Attendance
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  absent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  late: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  half_day: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  // Leaves
  sick: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  family: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  wedding: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  funeral: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  casual: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  annual: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  unpaid: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  // Payroll
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const EMOJI: Record<string, string> = {
  active: '✅',
  on_leave: '🌴',
  terminated: '⛔',
  pending: '⏳',
  approved: '✅',
  rejected: '❌',
  admin: '👑',
  manager: '🧭',
  employee: '🙂',
  on_hold: '⏸️',
  completed: '🏁',
  cancelled: '🚫',
  present: '🟢',
  absent: '🔴',
  late: '⏰',
  half_day: '🌓',
  sick: '🤒',
  family: '👨‍👩‍👧',
  wedding: '💍',
  funeral: '🕊️',
  casual: '🏖️',
  annual: '📅',
  unpaid: '💸',
  paid: '💵',
}

export function Badge({ value }: { value: string }) {
  const normalized = value.toLowerCase()
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        STYLES[normalized] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      }`}
    >
      {EMOJI[normalized] && <span>{EMOJI[normalized]}</span>}
      {value.replace('_', ' ')}
    </span>
  )
}
