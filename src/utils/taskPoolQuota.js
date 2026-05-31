import { mondayOfWeekYmd } from '@/utils/curiosityPeriod'
import { isWeeklyQuotaTask } from '@/utils/taskPoolProject'

export function syncWeeklyQuotaWeek(task, todayYmd) {
  const monday = mondayOfWeekYmd(todayYmd)
  if (task.weekly_quota_week_start === monday) return task
  return {
    ...task,
    weekly_quota_week_start: monday,
    weekly_quota_progress: 0,
  }
}

export function weeklyQuotaMet(task) {
  if (!isWeeklyQuotaTask(task)) return true
  const target = Number(task.weekly_quota_target ?? 0)
  const progress = Number(task.weekly_quota_progress ?? 0)
  return target > 0 && progress >= target
}

export function shouldAssignWeeklyQuotaTask(task, todayYmd) {
  if (!isWeeklyQuotaTask(task)) return false
  const synced = syncWeeklyQuotaWeek(task, todayYmd)
  return !weeklyQuotaMet(synced)
}
