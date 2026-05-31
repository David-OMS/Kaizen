import { supabase } from '@/services/supabase'
import { patchTaskPoolEntry } from '@/services/taskPoolService'
import { isWeeklyQuotaTask } from '@/utils/taskPoolProject'
import { mondayOfWeekYmd } from '@/utils/curiosityPeriod'

export { shouldAssignWeeklyQuotaTask, weeklyQuotaMet } from '@/utils/taskPoolQuota'

export async function ensureWeeklyQuotaWeekSynced(task, todayYmd) {
  if (!isWeeklyQuotaTask(task)) return task
  const monday = mondayOfWeekYmd(todayYmd)
  if (task.weekly_quota_week_start === monday) return task
  await patchTaskPoolEntry(task.id, {
    weekly_quota_week_start: monday,
    weekly_quota_progress: 0,
  })
  return { ...task, weekly_quota_week_start: monday, weekly_quota_progress: 0 }
}

export async function incrementWeeklyQuotaProgress(taskPoolId) {
  const { data: task, error } = await supabase.from('task_pool').select('*').eq('id', taskPoolId).single()
  if (error) throw error
  const next = Number(task.weekly_quota_progress ?? 0) + 1
  await patchTaskPoolEntry(taskPoolId, { weekly_quota_progress: next })
  return next
}

export async function syncAllWeeklyQuotaWeeks(pool, todayYmd) {
  for (const task of pool) {
    if (isWeeklyQuotaTask(task)) await ensureWeeklyQuotaWeekSynced(task, todayYmd)
  }
}
