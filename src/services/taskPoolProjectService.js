import { AI_EDGE_FUNCTIONS } from '@/constants/aiAnalysis'
import { QUEST_KIND, TASK_POOL_OUTCOME } from '@/constants/questLifecycle'
import { TASK_POOL_HORIZON } from '@/constants/taskPoolSchedule'
import { supabase } from '@/services/supabase'
import { patchTaskPoolEntry } from '@/services/taskPoolService'
import { getCompletedPhases, getPhases } from '@/utils/taskPoolProject'

export async function invokeDecomposeTaskProject({ title, context, completedPhases = [], additionalContext = '' }) {
  const { data, error } = await supabase.functions.invoke(AI_EDGE_FUNCTIONS.DECOMPOSE_TASK_PROJECT, {
    body: { title, context, completedPhases, additionalContext },
  })
  if (error) throw error
  if (!data?.phases?.length) throw new Error(data?.error || 'Project decomposition failed')
  return data
}

export async function decomposeAndPersistProject(taskId, { title, context, additionalContext = '', questKind }) {
  const raw = await invokeDecomposeTaskProject({ title, context, additionalContext })
  await patchTaskPoolEntry(taskId, {
    project_phases: raw.phases,
    current_phase_index: raw.phases.find((p) => p.status !== 'completed')?.index ?? 0,
    inferred_horizon: TASK_POOL_HORIZON.MULTI_DAY,
    quest_kind: questKind || QUEST_KIND.EXECUTION,
    type: 'daily_eligible',
    repeat_policy: 'until_completed',
  })
  return raw.phases
}

export async function restructureProject(task, additionalContext) {
  const completed = getCompletedPhases(task)
  const raw = await invokeDecomposeTaskProject({
    title: task.title,
    context: task.context_note || '',
    completedPhases: completed,
    additionalContext,
  })
  const nextIndex = raw.phases.find((p) => p.status !== 'completed')?.index ?? raw.phases.length
  await patchTaskPoolEntry(task.id, {
    project_phases: raw.phases,
    current_phase_index: nextIndex,
    context_note: additionalContext ? `${task.context_note || ''}\n${additionalContext}`.trim() : task.context_note,
  })
  return raw.phases
}

export async function advanceProjectPhase(taskPoolId, phaseIndex) {
  const { data: task, error } = await supabase.from('task_pool').select('*').eq('id', taskPoolId).single()
  if (error) throw error

  const phases = getPhases(task).map((p) =>
    Number(p.index) === Number(phaseIndex) ? { ...p, status: 'completed', completed_at: new Date().toISOString() } : p,
  )
  const next = phases.find((p) => p.status !== 'completed')
  const patch = {
    project_phases: phases,
    current_phase_index: next?.index ?? phases.length,
  }
  if (!next) {
    patch.last_outcome = TASK_POOL_OUTCOME.COMPLETED
    patch.focus_active = false
  }
  await patchTaskPoolEntry(taskPoolId, patch)
  return { done: !next, nextPhase: next }
}
