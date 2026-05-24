/** Calendar months in Africa/Lagos (UTC+1, no DST). */

export const LAGOS_TZ = 'Africa/Lagos'

export function getLagosCalendarParts(date = new Date()) {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: LAGOS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  const [y, m, d] = s.split('-').map((x) => Number(x))
  return { year: y, month: m, day: d }
}

export function daysInCalendarMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Start of last calendar day of (year, month) in Lagos, as ISO UTC instant (reward becomes claimable). */
export function readyAtForPeriod(year, month) {
  const last = daysInCalendarMonth(year, month)
  const mm = String(month).padStart(2, '0')
  const dd = String(last).padStart(2, '0')
  return new Date(`${year}-${mm}-${dd}T00:00:00+01:00`).toISOString()
}

export function isClaimable(readyAtIso, now = new Date()) {
  return now.getTime() >= new Date(readyAtIso).getTime()
}

/** Inclusive range: yields { year, month } from start through end (chronological). */
export function* eachCalendarMonth(startYear, startMonth, endYear, endMonth) {
  let y = startYear
  let m = startMonth
  for (;;) {
    yield { year: y, month: m }
    if (y === endYear && m === endMonth) break
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
}
