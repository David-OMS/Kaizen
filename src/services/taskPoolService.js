import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { QUEST_KIND, TASK_POOL_OUTCOME } from '@/constants/questLifecycle'

export async function getTaskPool() {
  const { data, error } = await supabase
    .from('task_pool')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createTaskPoolEntryRaw({ title, contextNote, mandatory, linkedClientId, questKind, patch = {} }) {
  const userId = await getAuthenticatedUserId()

  const { data, error } = await supabase
    .from('task_pool')
    .insert({
      user_id: userId,
      title,
      context_note: contextNote || null,
      type: patch.type || 'daily_eligible',
      linked_client_id: linkedClientId || null,
      mandatory: Boolean(mandatory),
      priority: patch.priority || 'normal',
      quest_kind: questKind || QUEST_KIND.EXECUTION,
      repeat_policy: patch.repeat_policy || 'until_completed',
      weekly_distribution_mode: patch.weekly_distribution_mode || 'adaptive',
      focus_active: patch.focus_active ?? true,
      inferred_horizon: patch.inferred_horizon ?? null,
      inferred_importance: patch.inferred_importance ?? 50,
      goal_alignment_score: patch.goal_alignment_score ?? 50,
      ai_confidence: patch.ai_confidence ?? 0.5,
      ai_classified_at: patch.ai_classified_at ?? null,
      weekly_target_days: patch.weekly_target_days ?? null,
      weekly_quota_target: patch.weekly_quota_target ?? null,
      weekly_quota_progress: patch.weekly_quota_progress ?? 0,
      weekly_quota_week_start: patch.weekly_quota_week_start ?? null,
      project_phases: patch.project_phases ?? [],
      current_phase_index: patch.current_phase_index ?? 0,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function createTaskPoolEntry(payload) {
  const { createAndClassifyTaskPool } = await import('@/services/taskPoolClassifyService')
  return createAndClassifyTaskPool(payload)
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

export async function markTaskPoolTrackComplete(taskId) {
  const userId = await getAuthenticatedUserId()
  const { data: row, error: readErr } = await supabase
    .from('task_pool')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single()

  if (readErr) throw readErr
  if (row.last_outcome === TASK_POOL_OUTCOME.COMPLETED) {
    throw new Error('This task is already marked complete.')
  }
  const isLongTrack = row.type === 'weekly_eligible' && row.repeat_policy === 'always'
  if (!isLongTrack) {
    throw new Error('One-shot tasks must be completed on your daily quest board to earn XP.')
  }
  if (Number(row.times_assigned || 0) < 1) {
    throw new Error('This track has not been assigned yet — nothing to close.')
  }

  const { data, error } = await supabase
    .from('task_pool')
    .update({
      last_outcome: TASK_POOL_OUTCOME.COMPLETED,
      focus_active: false,
    })
    .eq('id', taskId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function appendProjectContextAndRestructure(taskId, additionalContext) {
  const { restructureProject } = await import('@/services/taskPoolProjectService')
  const { data: task, error } = await supabase.from('task_pool').select('*').eq('id', taskId).single()
  if (error) throw error
  return restructureProject(task, additionalContext)
}

export async function patchTaskPoolWeeklyQuota(taskId, weeklyQuotaTarget) {
  const target = Math.min(14, Math.max(1, Number(weeklyQuotaTarget) || 1))
  const { data, error } = await supabase
    .from('task_pool')
    .update({ weekly_quota_target: target })
    .eq('id', taskId)
    .select('*')
    .single()
  if (error) throw error
  return data
}
