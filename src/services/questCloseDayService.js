import { QUEST_PERIODS } from '@/constants/questOptions'
import {
  QUEST_ASSESSMENT_STATUS,
  QUEST_LOG_OUTCOME,
  QUEST_STATUS,
  TASK_POOL_OUTCOME,
} from '@/constants/questLifecycle'
import { appendQuestLogEntry, getQuestsForAssignedDate, updateQuestRow } from '@/services/questService'
import { getTaskPool } from '@/services/taskPoolService'
import { getQuestPenaltyXp, grantQuestXp } from '@/services/questRewardService'
import { updateTaskPoolOutcome } from '@/services/taskPoolService'
import { buildGraceUntilNextMorning, qualifiesForLeniency } from '@/utils/questLeniency'
import { completionRateFromLogs } from '@/services/questMetricsService'

const OPEN_STATUSES = [
  QUEST_STATUS.ACTIVE,
  QUEST_STATUS.EXTENDED,
  QUEST_STATUS.INCOMPLETE,
  QUEST_STATUS.ASSESSMENT_PENDING,
]

function isSuccessfullyDone(quest) {
  if (quest.status !== QUEST_STATUS.COMPLETED) return false
  if (quest.quest_kind === 'learning') {
    return quest.assessment_status === QUEST_ASSESSMENT_STATUS.PASSED
  }
  return true
}

export async function closeQuestDay({ assignedDate, profile, recentLogs }) {
  const quests = await getQuestsForAssignedDate(assignedDate, QUEST_PERIODS.DAILY)
  const pool = await getTaskPool()
  const poolById = Object.fromEntries(pool.map((t) => [t.id, t]))
  const open = quests.filter((q) => OPEN_STATUSES.includes(q.status))
  const rate = completionRateFromLogs(recentLogs)
  const lenient = qualifiesForLeniency({
    streakCurrent: profile.streak_current,
    completionRate: rate,
  })

  for (const quest of open) {
    const graceUntil = quest.grace_until ? new Date(quest.grace_until) : null
    const now = new Date()
    if (graceUntil && graceUntil > now) continue

    if (lenient && !quest.grace_until && quest.status === QUEST_STATUS.ACTIVE) {
      await updateQuestRow(quest.id, {
        grace_until: buildGraceUntilNextMorning(now),
      })
      continue
    }

    await updateQuestRow(quest.id, {
      status: QUEST_STATUS.EXPIRED,
      completed_at: now.toISOString(),
    })

    const penalty = getQuestPenaltyXp(QUEST_PERIODS.DAILY, 'expired')
    await appendQuestLogEntry({
      questId: quest.id,
      title: quest.title,
      period: quest.period,
      outcome: QUEST_LOG_OUTCOME.EXPIRED,
      xpDelta: penalty,
    })
    await grantQuestXp({
      amount: penalty,
      period: quest.period,
      description: `Daily quest expired: ${quest.title}`,
    })

    if (quest.task_pool_id) {
      if (quest.analysis_snapshot?.weekly_session) continue
      const mandatory = poolById[quest.task_pool_id]?.mandatory ?? false
      await updateTaskPoolOutcome(quest.task_pool_id, {
        lastOutcome: mandatory ? TASK_POOL_OUTCOME.DROPPED : TASK_POOL_OUTCOME.EXPIRED,
        incrementDrop: !mandatory,
      })
    }
  }

  return { closed: open.length }
}

export { isSuccessfullyDone }
