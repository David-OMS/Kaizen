export function filterPackedByUsedPoolIds<T extends { taskPoolId?: string | null }>(
  packed: T[],
  usedPoolIds: string[],
): T[] {
  const used = new Set(usedPoolIds)
  return packed.filter((item) => {
    const pid = item.taskPoolId
    if (!pid) return true
    if (used.has(pid)) return false
    used.add(pid)
    return true
  })
}
