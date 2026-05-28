import { xpPerClaimForHabit } from '@/constants/sapienHabitXp'
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
  const integrationLevel = Math.min(5, Math.max(1, Number(payload.integrationLevel) || 3))
  const habitKind = payload.habitKind
  const targetCount = payload.targetCount
  const stub = {
    integration_level: integrationLevel,
    habit_kind: habitKind,
    target_count: targetCount,
  }
  const xpPerClaim = xpPerClaimForHabit(stub)

  const { data, error } = await supabase
    .from('sapien_habits')
    .insert({
      user_id: userId,
      title: payload.title,
      integration_level: integrationLevel,
      xp_per_claim: xpPerClaim,
      habit_kind: habitKind,
      target_count: targetCount,
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
  if (patch.habitKind != null) row.habit_kind = patch.habitKind
  if (patch.targetCount != null) row.target_count = patch.targetCount
  if (patch.scheduleDays != null) row.schedule_days = patch.scheduleDays
  if (patch.active != null) row.active = patch.active
  if (patch.integrationLevel != null) row.integration_level = patch.integrationLevel

  if (patch.integrationLevel != null || patch.habitKind != null || patch.targetCount != null) {
    const { data: existing } = await supabase.from('sapien_habits').select('*').eq('id', id).single()
    if (existing) {
      const merged = { ...existing, ...row }
      row.xp_per_claim = xpPerClaimForHabit(merged)
    }
  }

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
