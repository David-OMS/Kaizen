import { QUEST_ASSESSMENT_STATUS, QUEST_LOG_OUTCOME, QUEST_STATUS } from '@/constants/questLifecycle'
import { invokeGradeQuestAssessment, invokeQuestAssessmentGenerate } from '@/services/questAiService'
import { appendQuestLogEntry, updateQuestRow } from '@/services/questService'
import { getQuestRewards } from '@/utils/quest'
import { grantQuestXp } from '@/services/questRewardService'
import { updateProfileStreak } from '@/services/profileService'
import { hasCompletedDailyOnDate, getYesterdayDailyCompletionStatus } from '@/services/questService'
import { QUEST_PERIODS } from '@/constants/questOptions'

async function bumpStreakIfNeeded(profile, period) {
  if (period !== QUEST_PERIODS.DAILY) return
  const hasCompletedToday = await hasCompletedDailyOnDate(new Date())
  if (hasCompletedToday) return
  const hadYesterday = await getYesterdayDailyCompletionStatus()
  const nextCurrent = hadYesterday ? Number(profile.streak_current || 0) + 1 : 1
  const nextBest = Math.max(Number(profile.streak_best || 0), nextCurrent)
  await updateProfileStreak({ streakCurrent: nextCurrent, streakBest: nextBest })
}

export async function markLearningQuestDone(quest) {
  return updateQuestRow(quest.id, {
    status: QUEST_STATUS.ASSESSMENT_PENDING,
    assessment_status: QUEST_ASSESSMENT_STATUS.PENDING,
    started_at: quest.started_at || new Date().toISOString(),
  })
}

export async function generateQuestAssessment(quest) {
  const raw = await invokeQuestAssessmentGenerate({
    title: quest.title,
    context: quest.analysis_snapshot?.context || '',
  })
  const snapshot = {
    questions: raw.questions ?? [],
    generated_at: new Date().toISOString(),
    fallback_used: raw.fallbackUsed,
  }
  await updateQuestRow(quest.id, { assessment_snapshot: snapshot })
  return snapshot
}

export async function submitQuestAssessment({ quest, answers, profile }) {
  const computed = getQuestRewards(quest.period)
  const grade = await invokeGradeQuestAssessment({
    title: quest.title,
    questions: quest.assessment_snapshot?.questions,
    answers,
    xpReward: computed.reward,
  })

  if (grade.pass) {
    const row = await updateQuestRow(quest.id, {
      status: QUEST_STATUS.COMPLETED,
      assessment_status: QUEST_ASSESSMENT_STATUS.PASSED,
      completed_at: new Date().toISOString(),
    })
    await appendQuestLogEntry({
      questId: quest.id,
      title: quest.title,
      period: quest.period,
      outcome: QUEST_LOG_OUTCOME.ASSESSMENT_PASS,
      xpDelta: computed.reward,
    })
    await grantQuestXp({
      amount: computed.reward,
      period: quest.period,
      description: `Learning quest passed: ${quest.title}`,
    })
    await bumpStreakIfNeeded(profile, quest.period)
    return { quest: row, pass: true, grade }
  }

  const partial = Number(grade.partialXp || 0)
  const row = await updateQuestRow(quest.id, {
    status: QUEST_STATUS.FAILED,
    assessment_status: QUEST_ASSESSMENT_STATUS.FAILED,
    completed_at: new Date().toISOString(),
  })
  await appendQuestLogEntry({
    questId: quest.id,
    title: quest.title,
    period: quest.period,
    outcome: QUEST_LOG_OUTCOME.ASSESSMENT_FAIL,
    xpDelta: partial > 0 ? partial : -computed.penalty,
  })
  if (partial > 0) {
    await grantQuestXp({
      amount: partial,
      period: quest.period,
      description: `Learning quest partial: ${quest.title}`,
    })
  } else {
    await grantQuestXp({
      amount: -computed.penalty,
      period: quest.period,
      description: `Learning quest failed assessment: ${quest.title}`,
    })
  }

  return { quest: row, pass: false, grade }
}
