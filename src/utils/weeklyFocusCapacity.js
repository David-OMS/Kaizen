import { computeWeeklyBudgetPoints, loadPointsForQuest } from '@/utils/questBudget'
import { isTaskPoolFullyComplete } from '@/utils/taskPoolComplete'

const REPEATABLE_WEEKLY_TYPE = 'weekly_eligible'
const REPEAT_ALWAYS = 'always'

function taskWeeklyDemandPoints(task) {
  const targetDays = Number(task.weekly_target_days || 0)
  const safeDays = targetDays >= 1 && targetDays <= 7 ? targetDays : 3
  const pointsPerSession = loadPointsForQuest({
    difficulty: 'medium',
    questKind: task.quest_kind || 'execution',
  })
  return safeDays * pointsPerSession
}

export function getRepeatableWeeklyTasks(tasks) {
  return (tasks ?? []).filter(
    (t) =>
      t.type === REPEATABLE_WEEKLY_TYPE &&
      t.repeat_policy === REPEAT_ALWAYS &&
      !isTaskPoolFullyComplete(t),
  )
}

export function computeWeeklyFocusCapacity({ tasks, profile }) {
  const repeatable = getRepeatableWeeklyTasks(tasks)
  const weeklyBudget = computeWeeklyBudgetPoints({
    bandwidth: profile?.quest_bandwidth || 'normal',
    behaviorAdj: 0,
  })
  const focusBudget = Math.max(6, Math.floor(weeklyBudget * 0.6))

  const sortedByDemand = [...repeatable]
    .map((task) => ({ task, demand: taskWeeklyDemandPoints(task) }))
    .sort((a, b) => a.demand - b.demand)

  let used = 0
  let simultaneousLimit = 0
  for (const row of sortedByDemand) {
    if (used + row.demand > focusBudget) break
    used += row.demand
    simultaneousLimit += 1
  }
  simultaneousLimit = Math.max(1, simultaneousLimit)

  const active = repeatable.filter((t) => t.focus_active !== false)
  const overCapacity = repeatable.length > simultaneousLimit || active.length > simultaneousLimit

  return {
    weeklyBudget,
    focusBudget,
    simultaneousLimit,
    repeatable,
    active,
    overCapacity,
  }
}
