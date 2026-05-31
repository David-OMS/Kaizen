import { TASK_POOL_HORIZON } from '@/constants/taskPoolSchedule'

export function getPhases(task) {
  const raw = task?.project_phases
  return Array.isArray(raw) ? raw : []
}

export function getActivePhase(task) {
  const phases = getPhases(task)
  const idx = Number(task?.current_phase_index ?? 0)
  return phases.find((p) => Number(p.index) === idx && p.status !== 'completed') ?? phases.find((p) => p.status !== 'completed')
}

export function getCompletedPhases(task) {
  return getPhases(task).filter((p) => p.status === 'completed')
}

export function isMultiDayProject(task) {
  return task?.inferred_horizon === TASK_POOL_HORIZON.MULTI_DAY
}

export function isWeeklyQuotaTask(task) {
  return task?.inferred_horizon === TASK_POOL_HORIZON.WEEKLY_QUOTA
}

export function projectProgressLabel(task) {
  const phases = getPhases(task)
  const done = phases.filter((p) => p.status === 'completed').length
  return `${done}/${phases.length} phases`
}

export function quotaProgressLabel(task) {
  const done = Number(task?.weekly_quota_progress ?? 0)
  const target = Number(task?.weekly_quota_target ?? 0)
  return `${done}/${target} this week`
}

export function multiDayReadyForAssignment(task) {
  if (!isMultiDayProject(task)) return false
  return Boolean(getActivePhase(task))
}

export function buildQuestTitleForPoolTask(task) {
  if (isMultiDayProject(task)) {
    const phase = getActivePhase(task)
    if (!phase) return task.title
    return `${task.title} — Day ${Number(phase.index) + 1}: ${phase.title}`
  }
  if (isWeeklyQuotaTask(task)) {
    return `${task.title} (${quotaProgressLabel(task)})`
  }
  return task.title
}

export function buildQuestContextForPoolTask(task) {
  if (isMultiDayProject(task)) {
    const phase = getActivePhase(task)
    return phase?.contextNote || task.context_note || ''
  }
  return task.context_note || ''
}

export function buildProjectSnapshot(task, phase) {
  if (!isMultiDayProject(task) || !phase) return undefined
  return {
    project_task_id: task.id,
    phase_index: phase.index,
    phase_title: phase.title,
    project_phase: true,
  }
}
