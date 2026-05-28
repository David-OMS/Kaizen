import { isHabitDueOnDate } from '@/utils/sapienSchedule'

function toYmd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date, delta) {
  const next = new Date(date)
  next.setDate(next.getDate() + delta)
  return next
}

export function groupClaimsByDate(claims) {
  const map = new Map()
  for (const c of claims ?? []) {
    const key = c.claim_date
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(c)
  }
  return map
}

export function isHabitDayComplete(habit, claimsOnDate) {
  const count = (claimsOnDate ?? []).length
  const target = habit.habit_kind === 'count' ? Math.max(1, habit.target_count) : 1
  return count >= target
}

/**
 * Consecutive scheduled days fully completed, ending on the most recent completed due day.
 * Incomplete today does not break the streak until the day ends (we skip today if incomplete).
 */
export function computeHabitStreak(habit, claims, { anchorDate = new Date(), maxDays = 400 } = {}) {
  const byDate = groupClaimsByDate(claims)
  let current = 0
  let cursor = new Date(anchorDate)
  let skippedToday = false

  for (let i = 0; i < maxDays; i += 1) {
    const ymd = toYmd(cursor)
    const due = isHabitDueOnDate(habit.schedule_days, cursor)

    if (!due) {
      cursor = addDays(cursor, -1)
      continue
    }

    const complete = isHabitDayComplete(habit, byDate.get(ymd))

    if (i === 0 && !complete) {
      skippedToday = true
      cursor = addDays(cursor, -1)
      continue
    }

    if (complete) {
      current += 1
      cursor = addDays(cursor, -1)
      continue
    }

    break
  }

  return { current, skippedToday }
}

export function mergeStreakBest(previousBest, current) {
  return Math.max(Number(previousBest) || 0, Number(current) || 0)
}
