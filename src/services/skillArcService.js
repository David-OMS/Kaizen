import { ARC_ACTIVE_STATUSES, MAX_ACTIVE_SKILL_ARCS } from '@/constants/skillsEngine'
import { ARC_QUEST_META } from '@/constants/skillArcMetadata'
import { validateArcQuestLinks } from '@/utils/skillArcRules'
import { createSpecialtySkill, unlockSkillById } from '@/services/skillsService'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'

export async function getSkillArcs() {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('skill_arcs')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createSkillArc({ skillId, proposedSkillName, metadata = {} }) {
  const userId = await getAuthenticatedUserId()

  const { data, error } = await supabase
    .from('skill_arcs')
    .insert({
      user_id: userId,
      skill_id: skillId || null,
      proposed_skill_name: proposedSkillName || null,
      status: 'proposed',
      metadata,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function patchSkillArcMetadata(id, patch) {
  const userId = await getAuthenticatedUserId()
  const { data: arc, error: fetchError } = await supabase
    .from('skill_arcs')
    .select('metadata')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError

  const next = { ...(arc.metadata || {}), ...patch }
  const { data, error } = await supabase
    .from('skill_arcs')
    .update({ metadata: next })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function attachSkillArcQuests(arcId, { weeklyQuestId, dailyQuestIds }) {
  const v = validateArcQuestLinks(weeklyQuestId, dailyQuestIds)
  if (!v.ok) throw new Error(v.message)

  return patchSkillArcMetadata(arcId, {
    [ARC_QUEST_META.WEEKLY]: weeklyQuestId,
    [ARC_QUEST_META.DAILIES]: dailyQuestIds,
  })
}

export async function activateSkillArc(arcId) {
  const userId = await getAuthenticatedUserId()
  const { data: arc, error: fetchError } = await supabase
    .from('skill_arcs')
    .select('*')
    .eq('id', arcId)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError
  if (arc.status !== 'accepted') throw new Error('Arc must be accepted before activation.')

  const meta = arc.metadata || {}
  const v = validateArcQuestLinks(meta[ARC_QUEST_META.WEEKLY], meta[ARC_QUEST_META.DAILIES])
  if (!v.ok) throw new Error(v.message)

  return updateSkillArcStatus(arcId, 'active')
}

export async function finalizeArcUnlock(arcId) {
  const userId = await getAuthenticatedUserId()
  const { data: arc, error: fetchError } = await supabase
    .from('skill_arcs')
    .select('*')
    .eq('id', arcId)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError
  if (arc.status !== 'verification') throw new Error('Arc must be in verification to finalize.')

  let skillId = arc.skill_id
  if (!skillId) {
    if (!arc.proposed_skill_name) throw new Error('Missing specialty skill name.')
    const created = await createSpecialtySkill({
      name: arc.proposed_skill_name,
      description: 'Unlocked via skill arc.',
    })
    skillId = created.id
  } else {
    await unlockSkillById(skillId)
  }

  const { data, error } = await supabase
    .from('skill_arcs')
    .update({ status: 'unlocked', skill_id: skillId })
    .eq('id', arcId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateSkillArcStatus(id, status) {
  const userId = await getAuthenticatedUserId()

  if (ARC_ACTIVE_STATUSES.includes(status)) {
    const { count, error: countError } = await supabase
      .from('skill_arcs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ARC_ACTIVE_STATUSES)
      .neq('id', id)

    if (countError) throw countError
    if ((count ?? 0) >= MAX_ACTIVE_SKILL_ARCS) {
      throw new Error('Another skill arc is already active. Pause or complete it first.')
    }
  }

  const { data, error } = await supabase
    .from('skill_arcs')
    .update({ status })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}
