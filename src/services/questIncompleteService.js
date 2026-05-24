import { QUEST_EXTENSION } from '@/constants/questBudget'
import { QUEST_LOG_OUTCOME, QUEST_STATUS, TASK_POOL_OUTCOME } from '@/constants/questLifecycle'
import { invokeJudgeIncompleteReason } from '@/services/questAiService'
import { appendQuestLogEntry, updateQuestRow } from '@/services/questService'
import { getQuestPenaltyXp, grantQuestXp } from '@/services/questRewardService'
import { updateTaskPoolOutcome } from '@/services/taskPoolService'

export async function submitQuestIncomplete({ quest, reason, profile }) {
  const verdict = await invokeJudgeIncompleteReason({
    questTitle: quest.title,
    reason,
    streak: profile?.streak_current ?? 0,
  })

  const extensionCount = Number(quest.extension_count ?? 0)
  if (verdict.solid && extensionCount < QUEST_EXTENSION.maxPerQuest) {
    const hours = verdict.extensionHours || QUEST_EXTENSION.defaultExtensionHours
    const graceUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
    const row = await updateQuestRow(quest.id, {
      status: QUEST_STATUS.EXTENDED,
      incomplete_reason: reason,
      incomplete_ai_verdict: verdict,
      extension_count: extensionCount + 1,
      grace_until: graceUntil,
    })

    await appendQuestLogEntry({
      questId: quest.id,
      title: quest.title,
      period: quest.period,
      outcome: QUEST_LOG_OUTCOME.EXTENDED,
      xpDelta: 0,
    })

    return { quest: row, extended: true, verdict }
  }

  const penalty = getQuestPenaltyXp(quest.period, 'incomplete_denied')
  const row = await updateQuestRow(quest.id, {
    status: QUEST_STATUS.FAILED,
    incomplete_reason: reason,
    incomplete_ai_verdict: verdict,
    completed_at: new Date().toISOString(),
  })

  await appendQuestLogEntry({
    questId: quest.id,
    title: quest.title,
    period: quest.period,
    outcome: QUEST_LOG_OUTCOME.INCOMPLETE,
    xpDelta: penalty,
  })
  await grantQuestXp({
    amount: penalty,
    period: quest.period,
    description: `Incomplete denied: ${quest.title}`,
  })

  if (quest.task_pool_id) {
    await updateTaskPoolOutcome(quest.task_pool_id, {
      lastOutcome: TASK_POOL_OUTCOME.INCOMPLETE_DENIED,
      incrementDrop: true,
    })
  }

  return { quest: row, extended: false, verdict }
}
