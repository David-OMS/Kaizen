import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { computeHabitStreak, mergeStreakBest } from '@/utils/sapienStreak'

export async function getSapienClaimsForHabit(habitId, daysBack = 120) {
  const since = new Date()
  since.setDate(since.getDate() - daysBack)
  const sinceYmd = since.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('sapien_claims')
    .select('*')
    .eq('habit_id', habitId)
    .gte('claim_date', sinceYmd)
    .order('claim_date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function refreshHabitStreak(habit) {
  const claims = await getSapienClaimsForHabit(habit.id)
  const { current } = computeHabitStreak(habit, claims)
  const streakBest = mergeStreakBest(habit.streak_best, current)
  const userId = await getAuthenticatedUserId()

  const { data, error } = await supabase
    .from('sapien_habits')
    .update({
      streak_current: current,
      streak_best: streakBest,
    })
    .eq('id', habit.id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return { habit: data, streakCurrent: current, streakBest }
}
