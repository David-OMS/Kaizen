import { isTaskPoolFullyComplete } from '@/utils/taskPoolComplete'
import {
  buildProjectSnapshot,
  buildQuestContextForPoolTask,
  buildQuestTitleForPoolTask,
  getActivePhase,
  isMultiDayProject,
  isWeeklyQuotaTask,
  multiDayReadyForAssignment,
} from '@/utils/taskPoolProject'
import { shouldAssignWeeklyQuotaTask } from '@/utils/taskPoolQuota'

export function shouldIncludePoolTaskForDaily(task, todayYmd) {
  if (isTaskPoolFullyComplete(task)) return false
  if (task.repeat_policy === 'until_completed' && task.last_outcome === 'completed') return false

  if (isMultiDayProject(task)) return multiDayReadyForAssignment(task)
  if (isWeeklyQuotaTask(task)) return shouldAssignWeeklyQuotaTask(task, todayYmd)

  return true
}

export function poolTaskToCandidate(task, meta = {}) {
  const phase = isMultiDayProject(task) ? getActivePhase(task) : null
  return {
    id: task.id,
    taskPoolId: task.id,
    title: buildQuestTitleForPoolTask(task),
    contextNote: buildQuestContextForPoolTask(task),
    mandatory: task.mandatory,
    priority: task.priority,
    drop_count: task.drop_count,
    difficulty: meta.difficulty || task.difficulty || 'medium',
    questKind: meta.questKind || task.quest_kind || 'execution',
    loadPoints: meta.loadPoints,
    sourceType: 'task_pool',
    analysisSnapshot: buildProjectSnapshot(task, phase),
  }
}
