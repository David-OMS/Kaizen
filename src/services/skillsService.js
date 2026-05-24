import { skillLevelFromXp } from '@/utils/skillProgress'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'

export async function getSkills() {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('unlocked', { ascending: false })
    .order('name', { ascending: true })

  if (error) throw error
  return data ?? []
}

/** Adds skill XP and refreshes cached skill level (profile XP uses addXP only). */
export async function applySkillXpDelta(skillId, delta) {
  const userId = await getAuthenticatedUserId()
  if (!skillId || !delta) return null

  const { data: row, error: fetchError } = await supabase
    .from('skills')
    .select('*')
    .eq('id', skillId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !row) return null

  const nextXp = Math.max(0, Number(row.xp || 0) + Number(delta))
  const nextLevel = skillLevelFromXp(nextXp)

  const { data, error } = await supabase
    .from('skills')
    .update({
      xp: nextXp,
      level: nextLevel,
      unlocked: Boolean(row.unlocked || nextLevel > 0 || nextXp > 0),
    })
    .eq('id', skillId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function createSpecialtySkill({ name, description }) {
  const userId = await getAuthenticatedUserId()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('skills')
    .insert({
      user_id: userId,
      name,
      description: description || '',
      skill_type: 'specialty',
      xp: 0,
      level: 0,
      curriculum_tier: 'foundation',
      active: true,
      unlocked: true,
      unlocked_at: now,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function unlockSkillById(skillId) {
  const userId = await getAuthenticatedUserId()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('skills')
    .update({ unlocked: true, unlocked_at: now, active: true })
    .eq('id', skillId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}
