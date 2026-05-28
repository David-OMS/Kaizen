import { getTaskPool, patchTaskPoolFocusSelection } from '@/services/taskPoolService'
import { computeWeeklyFocusCapacity } from '@/utils/weeklyFocusCapacity'
import { pickAutoFocusIds } from '@/utils/weeklyFocusRank'

export async function applyAutoWeeklyFocus(profile) {
  const tasks = await getTaskPool()
  const capacity = computeWeeklyFocusCapacity({ tasks, profile })
  const repeatable = capacity.repeatable

  if (!repeatable.length) return { applied: false, limit: 0, activeIds: [] }

  const activeIds = pickAutoFocusIds(tasks, capacity.simultaneousLimit)
  await patchTaskPoolFocusSelection(activeIds)

  return {
    applied: true,
    limit: capacity.simultaneousLimit,
    activeIds,
    archivedCount: Math.max(0, repeatable.length - activeIds.length),
  }
}
