import { QUEST_LOG_OUTCOME, QUEST_STATUS, TASK_POOL_OUTCOME } from '@/constants/questLifecycle'
import { invokeJudgeQuestFailure } from '@/services/questAiService'
import { appendQuestLogEntry, updateQuestRow } from '@/services/questService'
import { getQuestPenaltyXp, grantQuestXp } from '@/services/questRewardService'
import { updateTaskPoolOutcome } from '@/services/taskPoolService'
import { clampAttemptFailXp } from '@/utils/questAttemptFailXp'

export async function submitQuestAttemptFail({ quest, reason, profile }) {
  const reward = Number(quest.xp_reward ?? 0)
  const penalty = getQuestPenaltyXp(quest.period, 'failed')

  const verdict = await invokeJudgeQuestFailure({
    questTitle: quest.title,
    reason,
    xpReward: reward,
    xpPenalty: Math.abs(penalty),
    streak: profile?.streak_current ?? 0,
  })

  const xpDelta = clampAttemptFailXp({
    aiXpDelta: verdict.xpDelta,
    reward,
    penalty,
  })

  const row = await updateQuestRow(quest.id, {
    status: QUEST_STATUS.FAILED,
    attempt_fail_reason: reason,
    attempt_fail_verdict: verdict,
    completed_at: new Date().toISOString(),
  })

  await appendQuestLogEntry({
    questId: quest.id,
    title: quest.title,
    period: quest.period,
    outcome: QUEST_LOG_OUTCOME.FAILED,
    xpDelta,
  })

  if (xpDelta !== 0) {
    await grantQuestXp({
      amount: xpDelta,
      period: quest.period,
      description: `Attempt failed: ${quest.title}`,
    })
  }

  if (quest.task_pool_id) {
    if (!quest.attempt_fail_verdict?.weekly_session && !quest.analysis_snapshot?.weekly_session) {
      await updateTaskPoolOutcome(quest.task_pool_id, {
        lastOutcome: TASK_POOL_OUTCOME.FAILED,
        incrementDrop: xpDelta < 0,
      })
    }
  }

  return { quest: row, verdict, xpDelta }
}
