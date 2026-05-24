import { getAuthenticatedUserId, supabase } from '@/services/supabase'

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