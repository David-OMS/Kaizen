import { TASK_POOL_PRIORITY } from '@/constants/questLifecycle'
import { canFitInBudget } from '@/utils/questBudget'

function sortPoolCandidates(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.mandatory !== b.mandatory) return a.mandatory ? -1 : 1
    if (a.priority === TASK_POOL_PRIORITY.HIGH && b.priority !== TASK_POOL_PRIORITY.HIGH) return -1
    if (b.priority === TASK_POOL_PRIORITY.HIGH && a.priority !== TASK_POOL_PRIORITY.HIGH) return 1
    return Number(b.drop_count ?? 0) - Number(a.drop_count ?? 0)
  })
}

export function packQuestCandidates({ carryovers, poolTasks, aiSuggestions, totalBudget }) {
  const packed = []
  const usedPoolIds = new Set()

  for (const c of carryovers ?? []) {
    if (!canFitInBudget(packed, c.loadPoints, totalBudget)) continue
    packed.push({ ...c, carryover: true })
  }

  for (const task of sortPoolCandidates(poolTasks ?? [])) {
    if (usedPoolIds.has(task.id)) continue
    if (!canFitInBudget(packed, task.loadPoints, totalBudget)) continue
    usedPoolIds.add(task.id)
    packed.push(task)
  }

  for (const ai of aiSuggestions ?? []) {
    if (!canFitInBudget(packed, ai.loadPoints, totalBudget)) continue
    packed.push(ai)
  }

  return packed
}
