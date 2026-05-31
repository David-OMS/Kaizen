import {
  getTodayDailyCompletionStatus,
  getYesterdayDailyCompletionStatus,
} from '@/services/questService'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { getProfileTimezone } from '@/utils/questTimezone'

export async function getProfile() {
  const { data, error } = await supabase.from('profile').select('*').single()
  if (error) throw error
  return data
}

export async function updateProfileRank({ rank, title }) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('profile')
    .update({
      rank,
      title,
    })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateProfileStreak({ streakCurrent, streakBest }) {
  const userId = await getAuthenticatedUserId()
  const { error } = await supabase
    .from('profile')
    .update({
      streak_current: streakCurrent,
      streak_best: streakBest,
    })
    .eq('id', userId)

  if (error) throw error
}

/** First successful daily completion of the day — extend streak. */
export async function bumpDailyStreak(profile) {
  const tz = getProfileTimezone(profile)
  const hadYesterday = await getYesterdayDailyCompletionStatus(tz)
  const nextCurrent = hadYesterday ? Number(profile.streak_current || 0) + 1 : 1
  await updateProfileStreak({
    streakCurrent: nextCurrent,
    streakBest: Math.max(Number(profile.streak_best || 0), nextCurrent),
  })
}

/** On quests tab load: break streak only if yesterday and today both have no completion. */
export async function syncDailyStreakOnLoad(profile) {
  const tz = getProfileTimezone(profile)
  const completedYesterday = await getYesterdayDailyCompletionStatus(tz)
  const completedToday = await getTodayDailyCompletionStatus(tz)
  if (completedYesterday || completedToday) return
  if (Number(profile.streak_current || 0) === 0) return

  await updateProfileStreak({
    streakCurrent: 0,
    streakBest: Number(profile.streak_best || 0),
  })
}

export async function updateProfileProgress({ level, rank, title }) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('profile')
    .update({
      level,
      rank,
      title,
    })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}