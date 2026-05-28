export function computeWeeklyDebt({ dayOfWeek, targetDays, assignedCount }) {
  const expectedByToday = Math.ceil((dayOfWeek * targetDays) / 7)
  return Math.max(0, expectedByToday - assignedCount)
}

export function compareWeeklyTaskDebt(a, b) {
  if (a.weeklyDebt !== b.weeklyDebt) return b.weeklyDebt - a.weeklyDebt
  const alignA = Number(a.goal_alignment_score ?? 0)
  const alignB = Number(b.goal_alignment_score ?? 0)
  if (alignA !== alignB) return alignB - alignA
  const impA = Number(a.inferred_importance ?? 0)
  const impB = Number(b.inferred_importance ?? 0)
  if (impA !== impB) return impB - impA
  const lastA = a.last_assigned_at ? new Date(a.last_assigned_at).getTime() : 0
  const lastB = b.last_assigned_at ? new Date(b.last_assigned_at).getTime() : 0
  if (lastA !== lastB) return lastA - lastB
  return String(a.id).localeCompare(String(b.id))
}
