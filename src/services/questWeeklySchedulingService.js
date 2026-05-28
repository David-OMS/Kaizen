import { getTodayYmdInTimezone } from '@/utils/questTimezone'
import { getDailyQuestsInWeekForTaskPoolIds, getCurrentWeekBounds } from '@/services/questService'
import { invokeAnalyzeQuest } from '@/services/aiAnalysisService'
import { getTaskPool, patchTaskPoolEntry } from '@/services/taskPoolService'
import { loadPointsForQuest } from '@/utils/questBudget'
import { QUEST_KIND, QUEST_STATUS } from '@/constants/questLifecycle'
import { computeWeeklyDebt, compareWeeklyTaskDebt } from '@/utils/weeklyDebtRank'

const COUNTABLE_STATUSES = new Set([
  QUEST_STATUS.ACTIVE,
  QUEST_STATUS.EXTENDED,
  QUEST_STATUS.ASSESSMENT_PENDING,
  QUEST_STATUS.COMPLETED,
])

function weekdayIndex(ymd) {
  const d = new Date(`${ymd}T12:00:00`)
  const js = d.getDay()
  return js === 0 ? 7 : js
}

function estimateTargetFromDifficulty(difficulty, priority) {
  if (priority === 'high') return 5
  if (difficulty === 'hard') return 4
  if (difficulty === 'easy') return 2
  return 3
}

async function ensureWeeklyTargetDays(task) {
  const existing = Number(task.weekly_target_days || 0)
  if (existing >= 1 && existing <= 7) return existing
  let difficulty = 'medium'
  try {
    const analysis = await invokeAnalyzeQuest({ title: task.title, context: task.context_note || '' })
    difficulty = analysis?.analysis?.difficulty || difficulty
  } catch {
    // keep fallback difficulty
  }
  const target = estimateTargetFromDifficulty(difficulty, task.priority)
  await patchTaskPoolEntry(task.id, { weekly_target_days: target })
  return target
}

function shouldSkipForRepeatPolicy(task) {
  return task.repeat_policy === 'until_completed' && task.last_outcome === 'completed'
}

function shouldAssignToday({ distributionMode, dayOfWeek, targetDays, alreadyAssigned }) {
  if (alreadyAssigned >= targetDays) return false
  if (distributionMode === 'consecutive') {
    const startDay = Math.max(1, 8 - targetDays)
    return dayOfWeek >= startDay
  }
  const expectedByToday = Math.ceil((dayOfWeek * targetDays) / 7)
  return alreadyAssigned < expectedByToday
}

export async function buildWeeklyScheduledCandidates({ timezone }) {
  const pool = await getTaskPool()
  const weeklyTasks = pool.filter(
    (task) =>
      task.type === 'weekly_eligible' &&
      task.focus_active !== false &&
      !shouldSkipForRepeatPolicy(task),
  )
  if (!weeklyTasks.length) return []

  const today = getTodayYmdInTimezone(timezone)
  const { end: weekEnd } = getCurrentWeekBounds()
  const dayOfWeek = weekdayIndex(today)
  const rows = await getDailyQuestsInWeekForTaskPoolIds(weeklyTasks.map((t) => t.id))
  const rowsByTask = rows.reduce((acc, row) => {
    const key = row.task_pool_id
    if (!key) return acc
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  const scored = []
  for (const task of weeklyTasks) {
    const targetDays = await ensureWeeklyTargetDays(task)
    const taskRows = rowsByTask[task.id] ?? []
    const assignedCount = taskRows.filter((r) => COUNTABLE_STATUSES.has(r.status)).length
    const weeklyDebt = computeWeeklyDebt({ dayOfWeek, targetDays, assignedCount })
    scored.push({ task, targetDays, taskRows, assignedCount, weeklyDebt })
  }

  scored.sort((a, b) =>
    compareWeeklyTaskDebt(
      { ...a.task, weeklyDebt: a.weeklyDebt },
      { ...b.task, weeklyDebt: b.weeklyDebt },
    ),
  )

  const candidates = []
  for (const { task, targetDays, taskRows, assignedCount, weeklyDebt } of scored) {
    const dueToday = shouldAssignToday({
      distributionMode: task.weekly_distribution_mode || 'adaptive',
      dayOfWeek,
      targetDays,
      alreadyAssigned: assignedCount,
    })
    const hasToday = taskRows.some((r) => r.assigned_date === today && COUNTABLE_STATUSES.has(r.status))
    if (!dueToday || hasToday) continue

    const questKind = task.quest_kind || QUEST_KIND.EXECUTION
    const difficulty = task.difficulty || 'medium'
    candidates.push({
      id: task.id,
      taskPoolId: task.id,
      title: task.title,
      type: task.type,
      contextNote: task.context_note,
      mandatory: task.mandatory,
      priority: task.priority,
      difficulty,
      questKind,
      loadPoints: loadPointsForQuest({ difficulty, questKind }),
      sourceType: 'task_pool',
      period: 'daily',
      schedulingMeta: {
        weeklyTargetDays: targetDays,
        weeklyDistributionMode: task.weekly_distribution_mode || 'adaptive',
        weekEnd,
        weeklyDebt,
      },
    })
  }

  return candidates.sort((a, b) => (b.schedulingMeta?.weeklyDebt ?? 0) - (a.schedulingMeta?.weeklyDebt ?? 0))
}

export async function hasMetWeeklyTargetThisWeek(taskPoolId) {
  if (!taskPoolId) return false
  const pool = await getTaskPool()
  const task = pool.find((t) => t.id === taskPoolId)
  if (!task) return false
  const target = Number(task.weekly_target_days || 0)
  if (!target) return false
  const rows = await getDailyQuestsInWeekForTaskPoolIds([taskPoolId])
  const doneCount = rows.filter(
    (r) => r.status === QUEST_STATUS.COMPLETED || r.status === QUEST_STATUS.ASSESSMENT_PENDING,
  ).length
  return doneCount >= target
}
