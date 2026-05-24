import { getAuthenticatedUserId, supabase } from '@/services/supabase'

export async function getMilestonesForSkill(skillId) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('skill_milestones')
    .select('*')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .order('tier', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function completeMilestone(id, { verified = false } = {}) {
  const { data, error } = await supabase
    .from('skill_milestones')
    .update({
      completed: true,
      verified,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}
