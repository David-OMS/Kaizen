import { getRepeatableWeeklyTasks } from '@/utils/weeklyFocusCapacity'

function daysSince(iso) {
  if (!iso) return 999
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

export function rankTasksForAutoFocus(tasks) {
  const repeatable = getRepeatableWeeklyTasks(tasks)
  return [...repeatable].sort((a, b) => {
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
    return daysSince(b.last_assigned_at) - daysSince(a.last_assigned_at)
  })
}

export function pickAutoFocusIds(tasks, limit) {
  const ranked = rankTasksForAutoFocus(tasks)
  return ranked.slice(0, Math.max(0, limit)).map((t) => t.id)
}
