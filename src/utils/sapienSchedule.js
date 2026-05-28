/** @param {number[]} scheduleDays - JS weekday 0=Sun … 6=Sat */
export function isHabitDueOnDate(scheduleDays, date = new Date()) {
  const days = Array.isArray(scheduleDays) ? scheduleDays : []
  if (!days.length) return false
  return days.includes(date.getDay())
}

export function todayYmd(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatScheduleDays(scheduleDays) {
  const days = [...(scheduleDays ?? [])].sort((a, b) => a - b)
  if (days.length === 7) return 'Daily'
  if (!days.length) return 'Off'
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days.map((d) => labels[d]).join(', ')
}
