import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { classifyAndPersistTaskPool } from '@/services/taskPoolClassifyService'
import { QUEST_KIND } from '@/constants/questLifecycle'

export async function getTaskPool() {
  const { data, error } = await supabase
    .from('task_pool')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createTaskPoolEntry(payload) {
  const userId = await getAuthenticatedUserId()
  const questKind = payload.questKind || QUEST_KIND.LEARNING

  const { data, error } = await supabase
    .from('task_pool')
    .insert({
      user_id: userId,
      title: payload.title,
      context_note: payload.contextNote || null,
      type: 'daily_eligible',
      linked_client_id: payload.linkedClientId || null,
      mandatory: Boolean(payload.mandatory),
      priority: 'normal',
      quest_kind: questKind,
      repeat_policy: 'until_completed',
      weekly_distribution_mode: 'adaptive',
      focus_active: true,
    })
    .select('*')
    .single()

  if (error) throw error
  return classifyAndPersistTaskPool(data, {
    title: payload.title,
    contextNote: payload.contextNote,
    questKind,
    mandatory: payload.mandatory,
    linkedClientId: payload.linkedClientId,
  })
}

export async function patchTaskPoolEntry(taskId, patch) {
  const { error } = await supabase.from('task_pool').update(patch).eq('id', taskId)
  if (error) throw error
}

export async function patchTaskPoolFocusSelection(activeTaskIds) {
  const ids = [...new Set((activeTaskIds ?? []).filter(Boolean))]
  const userId = await getAuthenticatedUserId()
  const { data: rows, error: listErr } = await supabase
    .from('task_pool')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'weekly_eligible')
    .eq('repeat_policy', 'always')
  if (listErr) throw listErr

  const allIds = (rows ?? []).map((r) => r.id)
  for (const taskId of allIds) {
    const { error } = await supabase
      .from('task_pool')
      .update({ focus_active: ids.includes(taskId) })
      .eq('id', taskId)
      .eq('user_id', userId)
    if (error) throw error
  }
}

export async function incrementTaskAssignmentCount(taskId, currentCount) {
  const { error } = await supabase
    .from('task_pool')
    .update({
      times_assigned: Number(currentCount || 0) + 1,
      last_assigned_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  if (error) throw error
}

export async function updateTaskPoolOutcome(taskId, { lastOutcome, incrementDrop }) {
  const { data: row } = await supabase.from('task_pool').select('drop_count').eq('id', taskId).single()
  const patch = {
    last_outcome: lastOutcome,
    last_assigned_at: new Date().toISOString(),
  }
  if (incrementDrop) {
    patch.drop_count = Number(row?.drop_count ?? 0) + 1
  }
  const { error } = await supabase.from('task_pool').update(patch).eq('id', taskId)
  if (error) throw error
}
