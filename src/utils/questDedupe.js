/** One open daily per task_pool_id per assigned_date. */
export function filterPackedByUsedPoolIds(packed, usedPoolIds) {
  const used = new Set(usedPoolIds)
  return (packed ?? []).filter((item) => {
    const pid = item.taskPoolId ?? item.task_pool_id
    if (!pid) return true
    if (used.has(pid)) return false
    used.add(pid)
    return true
  })
}

export function duplicatePoolMetaForQuests(quests) {
  const byPool = new Map()
  for (const q of quests ?? []) {
    if (!q.task_pool_id) continue
    if (!byPool.has(q.task_pool_id)) byPool.set(q.task_pool_id, [])
    byPool.get(q.task_pool_id).push(q)
  }
  const keeperIdByPool = new Map()
  const duplicateIds = new Set()
  for (const [, rows] of byPool) {
    if (rows.length < 2) continue
    const sorted = [...rows].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    keeperIdByPool.set(sorted[0].task_pool_id, sorted[0].id)
    for (let i = 1; i < sorted.length; i += 1) duplicateIds.add(sorted[i].id)
  }
  return { duplicateIds, keeperIdByPool }
}
