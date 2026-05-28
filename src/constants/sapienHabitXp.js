/** Daily XP budget for a habit, split across count claims. Level 5 = deepest integration. */
export const SAPIEN_DAILY_XP_BY_LEVEL = {
  1: 5,
  2: 8,
  3: 12,
  4: 16,
  5: 22,
}

export const SAPIEN_INTEGRATION_MIN = 1
export const SAPIEN_INTEGRATION_MAX = 5

export function xpPerClaimForHabit(habit) {
  const level = Math.min(
    SAPIEN_INTEGRATION_MAX,
    Math.max(SAPIEN_INTEGRATION_MIN, Number(habit?.integration_level) || 3),
  )
  const daily = SAPIEN_DAILY_XP_BY_LEVEL[level] ?? SAPIEN_DAILY_XP_BY_LEVEL[3]
  const target = habit?.habit_kind === 'count' ? Math.max(1, Number(habit?.target_count) || 1) : 1
  return Math.max(1, Math.round(daily / target))
}

export function dailyXpTotalForHabit(habit) {
  const per = xpPerClaimForHabit(habit)
  const target = habit?.habit_kind === 'count' ? Math.max(1, Number(habit?.target_count) || 1) : 1
  return per * target
}
