import { getAuthenticatedUserId, supabase } from '@/services/supabase'

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

  const { data, error } = await supabase
    .from('task_pool')
    .insert({
      user_id: userId,
      title: payload.title,
      context_note: payload.contextNote || null,
      type: payload.type,
      linked_client_id: payload.linkedClientId || null,
      mandatory: Boolean(payload.mandatory),
      priority: payload.priority || 'normal',
      quest_kind: payload.questKind || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
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
