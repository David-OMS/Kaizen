import { TASK_POOL_OUTCOME } from '@/constants/questLifecycle'

export function isTaskPoolFullyComplete(task) {
  return task?.last_outcome === TASK_POOL_OUTCOME.COMPLETED
}

export function isLongWeeklyTrack(task) {
  return task?.type === 'weekly_eligible' && task?.repeat_policy === 'always'
}

/** Manual pool close — long tracks only, and only after provision picked them up at least once. */
export function canMarkTaskPoolComplete(task) {
  if (!task || isTaskPoolFullyComplete(task)) return false
  if (!isLongWeeklyTrack(task)) return false
  return Number(task.times_assigned || 0) >= 1
}

export function partitionTaskPool(tasks) {
  const active = []
  const completed = []
  for (const task of tasks ?? []) {
    if (isTaskPoolFullyComplete(task)) completed.push(task)
    else active.push(task)
  }
  return { active, completed }
}
