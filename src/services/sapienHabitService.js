import { getAuthenticatedUserId, supabase } from '@/services/supabase'

export async function getSapienHabits() {
  const { data, error } = await supabase
    .from('sapien_habits')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createSapienHabit(payload) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('sapien_habits')
    .insert({
      user_id: userId,
      title: payload.title,
      xp_per_claim: payload.xpPerClaim,
      habit_kind: payload.habitKind,
      target_count: payload.targetCount,
      schedule_days: payload.scheduleDays,
      sort_order: payload.sortOrder ?? 0,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateSapienHabit(id, patch) {
  const userId = await getAuthenticatedUserId()
  const row = {}
  if (patch.title != null) row.title = patch.title
  if (patch.xpPerClaim != null) row.xp_per_claim = patch.xpPerClaim
  if (patch.habitKind != null) row.habit_kind = patch.habitKind
  if (patch.targetCount != null) row.target_count = patch.targetCount
  if (patch.scheduleDays != null) row.schedule_days = patch.scheduleDays
  if (patch.active != null) row.active = patch.active

  const { data, error } = await supabase
    .from('sapien_habits')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deactivateSapienHabit(id) {
  return updateSapienHabit(id, { active: false })
}
