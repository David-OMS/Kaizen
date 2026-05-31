import { TASK_POOL_OUTCOME } from '@/constants/questLifecycle'
import { advanceProjectPhase } from '@/services/taskPoolProjectService'
import { incrementWeeklyQuotaProgress } from '@/services/taskPoolQuotaService'
import { getTaskPool, updateTaskPoolOutcome } from '@/services/taskPoolService'
import { hasMetWeeklyTargetThisWeek } from '@/services/questWeeklySchedulingService'
import { isMultiDayProject, isWeeklyQuotaTask } from '@/utils/taskPoolProject'

export async function applyTaskPoolOutcomeOnQuestSuccess(quest) {
  if (!quest?.task_pool_id) return

  const pool = await getTaskPool()
  const task = pool.find((t) => t.id === quest.task_pool_id)
  if (!task) return

  if (isMultiDayProject(task)) {
    const phaseIndex = quest.analysis_snapshot?.phase_index ?? task.current_phase_index
    await advanceProjectPhase(quest.task_pool_id, phaseIndex)
    return
  }

  if (isWeeklyQuotaTask(task)) {
    await incrementWeeklyQuotaProgress(quest.task_pool_id)
    return
  }

  if (task.repeat_policy === 'always') {
    const isWeeklySession = Boolean(quest.analysis_snapshot?.weekly_session)
    if (isWeeklySession && !(await hasMetWeeklyTargetThisWeek(quest.task_pool_id))) return
    if (isWeeklySession) return
  }

  if (task.repeat_policy === 'until_completed') {
    await updateTaskPoolOutcome(quest.task_pool_id, {
      lastOutcome: TASK_POOL_OUTCOME.COMPLETED,
      incrementDrop: false,
    })
  }
}
