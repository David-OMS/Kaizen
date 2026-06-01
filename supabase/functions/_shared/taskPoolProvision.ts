import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { mondayOfWeekYmd } from './curiosityPeriod.ts'

const HORIZON_MULTI_DAY = 'multi_day'
const HORIZON_WEEKLY_QUOTA = 'weekly_quota'

type Phase = { index: number; title: string; contextNote?: string; status: string }

type PoolTask = Record<string, unknown>

function getPhases(task: PoolTask): Phase[] {
  const raw = task.project_phases
  return Array.isArray(raw) ? (raw as Phase[]) : []
}

function getActivePhase(task: PoolTask): Phase | undefined {
  const phases = getPhases(task)
  const idx = Number(task.current_phase_index ?? 0)
  return phases.find((p) => Number(p.index) === idx && p.status !== 'completed') ?? phases.find((p) => p.status !== 'completed')
}

export function isMultiDayProject(task: PoolTask): boolean {
  return task.inferred_horizon === HORIZON_MULTI_DAY
}

export function isWeeklyQuotaTask(task: PoolTask): boolean {
  return task.inferred_horizon === HORIZON_WEEKLY_QUOTA
}

function weeklyQuotaMet(task: PoolTask): boolean {
  const target = Number(task.weekly_quota_target ?? 0)
  const progress = Number(task.weekly_quota_progress ?? 0)
  return target > 0 && progress >= target
}

export function shouldIncludePoolTaskForDaily(task: PoolTask, todayYmd: string): boolean {
  if (task.last_outcome === 'completed') return false
  if (task.repeat_policy === 'until_completed' && task.last_outcome === 'completed') return false

  if (isMultiDayProject(task)) return Boolean(getActivePhase(task))
  if (isWeeklyQuotaTask(task)) {
    const monday = mondayOfWeekYmd(todayYmd)
    if (task.weekly_quota_week_start !== monday) return true
    return !weeklyQuotaMet(task)
  }
  return true
}

export function buildQuestTitleForPoolTask(task: PoolTask): string {
  if (isMultiDayProject(task)) {
    const phase = getActivePhase(task)
    if (!phase) return String(task.title)
    return `${task.title} — Day ${Number(phase.index) + 1}: ${phase.title}`
  }
  if (isWeeklyQuotaTask(task)) {
    return `${task.title} (${Number(task.weekly_quota_progress ?? 0)}/${Number(task.weekly_quota_target ?? 0)} this week)`
  }
  return String(task.title)
}

export function buildProjectSnapshot(task: PoolTask, phase?: Phase) {
  if (!isMultiDayProject(task) || !phase) return null
  return {
    project_task_id: task.id,
    phase_index: phase.index,
    phase_title: phase.title,
    project_phase: true,
  }
}

export function poolTaskToCandidate(task: PoolTask, meta: { difficulty?: string; questKind?: string; loadPoints: number }) {
  const phase = isMultiDayProject(task) ? getActivePhase(task) : undefined
  return {
    id: task.id,
    taskPoolId: task.id,
    title: buildQuestTitleForPoolTask(task),
    mandatory: task.mandatory,
    priority: task.priority,
    drop_count: task.drop_count,
    difficulty: meta.difficulty || 'medium',
    questKind: meta.questKind || task.quest_kind || 'execution',
    loadPoints: meta.loadPoints,
    sourceType: 'task_pool',
    analysisSnapshot: buildProjectSnapshot(task, phase),
  }
}

export async function syncWeeklyQuotaWeeksAdmin(
  supabase: { from: (t: string) => ReturnType<SupabaseClient['from']> },
  userId: string,
  todayYmd: string,
) {
  const monday = mondayOfWeekYmd(todayYmd)
  const { data: rows } = await supabase.from('task_pool').select('*').eq('user_id', userId)
  for (const task of rows ?? []) {
    if (!isWeeklyQuotaTask(task)) continue
    if (task.weekly_quota_week_start === monday) continue
    const { error } = await supabase
      .from('task_pool')
      .update({ weekly_quota_week_start: monday, weekly_quota_progress: 0 })
      .eq('id', task.id)
    if (error) {
      throw new Error(
        `${error.code ?? 'db'} | ${error.message} | Run supabase/migrations/20260608_task_pool_projects_and_quotas.sql`,
      )
    }
  }
}
