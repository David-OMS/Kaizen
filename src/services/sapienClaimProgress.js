import { isHabitDueOnDate } from '@/utils/sapienSchedule'

function claimsForHabit(claims, habitId) {
  return claims.filter((c) => c.habit_id === habitId)
}

export function buildHabitProgress(habit, claims, claimDate) {
  const mine = claimsForHabit(claims, habit.id)
  const due = isHabitDueOnDate(habit.schedule_days, new Date(`${claimDate}T12:00:00`))
  const count = mine.length
  const target = habit.habit_kind === 'count' ? habit.target_count : 1
  const complete = count >= target

  return { due, count, target, complete, claims: mine }
}
