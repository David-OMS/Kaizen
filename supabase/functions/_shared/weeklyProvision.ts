import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { isoWeekdayFromYmd, getWeekBoundsForYmd } from './curiosityPeriod.ts'

const COUNTABLE = new Set(['active', 'extended', 'assessment_pending', 'completed'])
const LOAD: Record<string, number> = { easy: 1, medium: 2, hard: 4, legendary: 6 }

function loadPoints(difficulty: string, questKind: string): number {
  const base = LOAD[difficulty] ?? 2
  return base + (questKind === 'learning' ? 2 : 0)
}

function computeWeeklyDebt(dayOfWeek: number, targetDays: number, assignedCount: number): number {
  const expectedByToday = Math.ceil((dayOfWeek * targetDays) / 7)
  return Math.max(0, expectedByToday - assignedCount)
}

function compareWeeklyTaskDebt(
  a: Record<string, unknown> & { weeklyDebt: number },
  b: Record<string, unknown> & { weeklyDebt: number },
): number {
  if (a.weeklyDebt !== b.weeklyDebt) return b.weeklyDebt - a.weeklyDebt
  const alignA = Number(a.goal_alignment_score ?? 0)
  const alignB = Number(b.goal_alignment_score ?? 0)
  if (alignA !== alignB) return alignB - alignA
  const impA = Number(a.inferred_importance ?? 0)
  const impB = Number(b.inferred_importance ?? 0)
  if (impA !== impB) return impB - impA
  const lastA = a.last_assigned_at ? new Date(String(a.last_assigned_at)).getTime() : 0
  const lastB = b.last_assigned_at ? new Date(String(b.last_assigned_at)).getTime() : 0
  if (lastA !== lastB) return lastA - lastB
  return String(a.id).localeCompare(String(b.id))
}

function shouldSkipTask(task: Record<string, unknown>): boolean {
  if (task.last_outcome === 'completed') return true
  return task.repeat_policy === 'until_completed' && task.last_outcome === 'completed'
}

function estimateTarget(task: Record<string, unknown>): number {
  if (task.priority === 'high') return 5
  return 3
}

function shouldAssignToday(
  distributionMode: string,
  dayOfWeek: number,
  targetDays: number,
  alreadyAssigned: number,
): boolean {
  if (alreadyAssigned >= targetDays) return false
  if (distributionMode === 'consecutive') {
    const startDay = Math.max(1, 8 - targetDays)
    return dayOfWeek >= startDay
  }
  const expectedByToday = Math.ceil((dayOfWeek * targetDays) / 7)
  return alreadyAssigned < expectedByToday
}

function taskWeeklyDemand(task: Record<string, unknown>): number {
  const targetDays = Number(task.weekly_target_days || 0)
  const safeDays = targetDays >= 1 && targetDays <= 7 ? targetDays : 3
  return safeDays * loadPoints('medium', String(task.quest_kind || 'execution'))
}

function pickAutoFocusIds(tasks: Record<string, unknown>[], limit: number): string[] {
  const repeatable = tasks.filter(
    (t) => t.type === 'weekly_eligible' && t.repeat_policy === 'always' && t.last_outcome !== 'completed',
  )
  const ranked = [...repeatable].sort((a, b) => {
    if (a.mandatory !== b.mandatory) return a.mandatory ? -1 : 1
    const alignA = Number(a.goal_alignment_score ?? 0)
    const alignB = Number(b.goal_alignment_score ?? 0)
    if (alignA !== alignB) return alignB - alignA
    const impA = Number(a.inferred_importance ?? 0)
    const impB = Number(b.inferred_importance ?? 0)
    if (impA !== impB) return impB - impA
    const dropA = Number(a.drop_count ?? 0)
    const dropB = Number(b.drop_count ?? 0)
    if (dropA !== dropB) return dropA - dropB
    const lastA = a.last_assigned_at ? new Date(String(a.last_assigned_at)).getTime() : 0
    const lastB = b.last_assigned_at ? new Date(String(b.last_assigned_at)).getTime() : 0
    return lastB - lastA
  })
  return ranked.slice(0, Math.max(0, limit)).map((t) => String(t.id))
}

export async function applyAutoWeeklyFocus(
  supabase: SupabaseClient,
  userId: string,
  profile: Record<string, unknown>,
  poolRows: Record<string, unknown>[],
): Promise<void> {
  const repeatable = poolRows.filter(
    (t) => t.type === 'weekly_eligible' && t.repeat_policy === 'always' && t.last_outcome !== 'completed',
  )
  if (!repeatable.length) return

  const bw = String(profile.quest_bandwidth || 'normal')
  const weeklyBudget = bw === 'light' ? 10 : bw === 'push' ? 18 : 14
  const focusBudget = Math.max(6, Math.floor(weeklyBudget * 0.6))

  const sortedByDemand = [...repeatable]
    .map((task) => ({ task, demand: taskWeeklyDemand(task) }))
    .sort((a, b) => a.demand - b.demand)

  let used = 0
  let simultaneousLimit = 0
  for (const row of sortedByDemand) {
    if (used + row.demand > focusBudget) break
    used += row.demand
    simultaneousLimit += 1
  }
  simultaneousLimit = Math.max(1, simultaneousLimit)

  const activeIds = pickAutoFocusIds(poolRows, simultaneousLimit)
  const allWeeklyIds = poolRows.filter((t) => t.type === 'weekly_eligible' && t.repeat_policy === 'always').map(
    (t) => String(t.id),
  )

  for (const taskId of allWeeklyIds) {
    await supabase
      .from('task_pool')
      .update({ focus_active: activeIds.includes(taskId) })
      .eq('id', taskId)
      .eq('user_id', userId)
  }
}

export type WeeklyCandidate = {
  id: string
  taskPoolId: string
  title: string
  mandatory?: boolean
  priority?: string
  drop_count?: number
  difficulty: string
  questKind: string
  loadPoints: number
  sourceType: string
  schedulingMeta: {
    weeklyTargetDays: number
    weeklyDistributionMode: string
    weekEnd: string
    weeklyDebt: number
  }
}

export async function buildWeeklyScheduledCandidates(
  supabase: SupabaseClient,
  userId: string,
  poolRows: Record<string, unknown>[],
  todayYmd: string,
): Promise<WeeklyCandidate[]> {
  const weeklyTasks = poolRows.filter(
    (t) => t.type === 'weekly_eligible' && t.focus_active !== false && !shouldSkipTask(t),
  )
  if (!weeklyTasks.length) return []

  const dayOfWeek = isoWeekdayFromYmd(todayYmd)
  const { end: weekEnd } = getWeekBoundsForYmd(todayYmd)
  const taskIds = weeklyTasks.map((t) => String(t.id))

  const { data: weekRows } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', userId)
    .eq('period', 'daily')
    .in('task_pool_id', taskIds)
    .gte('assigned_date', getWeekBoundsForYmd(todayYmd).start)
    .lte('assigned_date', weekEnd)

  const rowsByTask: Record<string, Record<string, unknown>[]> = {}
  for (const row of weekRows ?? []) {
    const key = String(row.task_pool_id)
    if (!rowsByTask[key]) rowsByTask[key] = []
    rowsByTask[key].push(row)
  }

  const scored: {
    task: Record<string, unknown>
    targetDays: number
    taskRows: Record<string, unknown>[]
    assignedCount: number
    weeklyDebt: number
  }[] = []

  for (const task of weeklyTasks) {
    let targetDays = Number(task.weekly_target_days || 0)
    if (targetDays < 1 || targetDays > 7) {
      targetDays = estimateTarget(task)
      await supabase.from('task_pool').update({ weekly_target_days: targetDays }).eq('id', task.id)
    }
    const taskRows = rowsByTask[String(task.id)] ?? []
    const assignedCount = taskRows.filter((r) => COUNTABLE.has(String(r.status))).length
    const weeklyDebt = computeWeeklyDebt(dayOfWeek, targetDays, assignedCount)
    scored.push({ task, targetDays, taskRows, assignedCount, weeklyDebt })
  }

  scored.sort((a, b) =>
    compareWeeklyTaskDebt(
      { ...a.task, weeklyDebt: a.weeklyDebt },
      { ...b.task, weeklyDebt: b.weeklyDebt },
    ),
  )

  const candidates: WeeklyCandidate[] = []
  for (const { task, targetDays, taskRows, assignedCount, weeklyDebt } of scored) {
    const dueToday = shouldAssignToday(
      String(task.weekly_distribution_mode || 'adaptive'),
      dayOfWeek,
      targetDays,
      assignedCount,
    )
    const hasToday = taskRows.some(
      (r) => r.assigned_date === todayYmd && COUNTABLE.has(String(r.status)),
    )
    if (!dueToday || hasToday) continue

    const questKind = String(task.quest_kind || 'execution')
    const difficulty = String(task.difficulty || 'medium')
    candidates.push({
      id: String(task.id),
      taskPoolId: String(task.id),
      title: String(task.title),
      mandatory: Boolean(task.mandatory),
      priority: task.priority as string | undefined,
      drop_count: Number(task.drop_count ?? 0),
      difficulty,
      questKind,
      loadPoints: loadPoints(difficulty, questKind),
      sourceType: 'task_pool',
      schedulingMeta: {
        weeklyTargetDays: targetDays,
        weeklyDistributionMode: String(task.weekly_distribution_mode || 'adaptive'),
        weekEnd,
        weeklyDebt,
      },
    })
  }

  return candidates.sort(
    (a, b) => (b.schedulingMeta?.weeklyDebt ?? 0) - (a.schedulingMeta?.weeklyDebt ?? 0),
  )
}
