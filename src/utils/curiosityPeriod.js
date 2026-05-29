import { addDays, format, parseISO, startOfWeek } from 'date-fns'

/** Monday YYYY-MM-DD for the week containing `ymd`. */
export function mondayOfWeekYmd(ymd) {
  const d = parseISO(`${ymd}T12:00:00`)
  const monday = startOfWeek(d, { weekStartsOn: 1 })
  return format(monday, 'yyyy-MM-dd')
}

export function nextMondayYmd(ymd) {
  const mon = parseISO(`${mondayOfWeekYmd(ymd)}T12:00:00`)
  const d = parseISO(`${ymd}T12:00:00`)
  if (format(d, 'yyyy-MM-dd') === format(mon, 'yyyy-MM-dd')) {
    return format(mon, 'yyyy-MM-dd')
  }
  if (d > mon) {
    return format(addDays(mon, 7), 'yyyy-MM-dd')
  }
  return format(mon, 'yyyy-MM-dd')
}

export function monthKeyFromYmd(ymd) {
  return ymd.slice(0, 7)
}

/** ISO weekday: Mon=1 … Sun=7 */
export function isoWeekdayFromYmd(ymd) {
  const d = parseISO(`${ymd}T12:00:00`)
  const js = d.getDay()
  return js === 0 ? 7 : js
}

export function isSundayYmd(ymd) {
  return isoWeekdayFromYmd(ymd) === 7
}

export function parseJsonStringArray(value) {
  if (Array.isArray(value)) return value.map(String)
  return []
}
