/** Monday YYYY-MM-DD for the week containing `ymd`. */
export function mondayOfWeekYmd(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`)
  const iso = isoWeekdayFromYmd(ymd)
  d.setDate(d.getDate() - (iso - 1))
  return ymdFromDate(d)
}

export function nextMondayYmd(ymd: string): string {
  const mon = mondayOfWeekYmd(ymd)
  if (ymd === mon) return mon
  const d = new Date(`${mon}T12:00:00`)
  d.setDate(d.getDate() + 7)
  return ymdFromDate(d)
}

export function monthKeyFromYmd(ymd: string): string {
  return ymd.slice(0, 7)
}

/** ISO weekday: Mon=1 … Sun=7 */
export function isoWeekdayFromYmd(ymd: string): number {
  const js = new Date(`${ymd}T12:00:00`).getDay()
  return js === 0 ? 7 : js
}

export function parseJsonStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  return []
}

function ymdFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function weekBoundsFromMonday(mondayYmd: string): { start: string; end: string } {
  const d = new Date(`${mondayYmd}T12:00:00`)
  d.setDate(d.getDate() + 6)
  return { start: mondayYmd, end: ymdFromDate(d) }
}

export function getWeekBoundsForYmd(todayYmd: string): { start: string; end: string } {
  return weekBoundsFromMonday(mondayOfWeekYmd(todayYmd))
}
