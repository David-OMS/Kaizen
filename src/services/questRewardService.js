import { XP_EVENT_TYPES } from '@/constants/xpEvents'
import { QUEST_KIND } from '@/constants/questLifecycle'
import { QUEST_PENALTY_XP } from '@/constants/questPenalties'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { addXP } from '@/services/xpService'
import { getQuestRewards } from '@/utils/quest'

export function resolveExecutionQuestXp(quest) {
  const stored = Number(quest.xp_reward || 0)
  if (stored > 0) return { reward: stored, penalty: Number(quest.xp_penalty || 0) }
  const computed = getQuestRewards(quest.period)
  return computed
}

export function getQuestPenaltyXp(period, reason) {
  const isWeekly = period === QUEST_PERIODS.WEEKLY
  if (reason === 'expired') return isWeekly ? QUEST_PENALTY_XP.weeklyExpired : QUEST_PENALTY_XP.dailyExpired
  if (reason === 'incomplete_denied') {
    return isWeekly ? QUEST_PENALTY_XP.weeklyIncompleteDenied : QUEST_PENALTY_XP.dailyIncompleteDenied
  }
  return isWeekly ? QUEST_PENALTY_XP.weeklyFailed : QUEST_PENALTY_XP.dailyFailed
}

export function getQuestCompleteEventType(period) {
  return period === QUEST_PERIODS.WEEKLY
    ? XP_EVENT_TYPES.WEEKLY_QUEST_COMPLETED
    : XP_EVENT_TYPES.DAILY_QUEST_COMPLETED
}

export function getQuestFailEventType(period) {
  return period === QUEST_PERIODS.WEEKLY
    ? XP_EVENT_TYPES.WEEKLY_QUEST_FAILED
    : XP_EVENT_TYPES.DAILY_QUEST_FAILED
}

export async function grantQuestXp({ amount, period, description }) {
  if (!amount) return null
  const eventType = amount > 0 ? getQuestCompleteEventType(period) : getQuestFailEventType(period)
  return addXP(amount, eventType, description)
}

export function isLearningQuest(quest) {
  return quest?.quest_kind === QUEST_KIND.LEARNING
}
