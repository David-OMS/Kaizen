import { QUEST_ASSESSMENT_STATUS, QUEST_LOG_OUTCOME, QUEST_STATUS } from '@/constants/questLifecycle'
import { invokeGradeQuestAssessment, invokeQuestAssessmentGenerate } from '@/services/questAiService'
import { appendQuestLogEntry, updateQuestRow } from '@/services/questService'
import { getQuestRewards } from '@/utils/quest'
import { grantQuestXp } from '@/services/questRewardService'
import { bumpDailyStreak } from '@/services/profileService'
import { hasCompletedDailyOnYmd } from '@/services/questService'
import { getProfileTimezone, getTodayYmdInTimezone } from '@/utils/questTimezone'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { scheduleRecallAfterLearningPass } from '@/services/questRecallService'
import { onCuriosityWrapUpPassed } from '@/services/curiosityRotationService'
import { applyTaskPoolOutcomeOnQuestSuccess } from '@/services/taskPoolOutcomeOnSuccess'
import { QUEST_SOURCE_TYPES } from '@/constants/questEngine'
import { CURIOSITY_TRACK } from '@/constants/curiosity'

const MIN_BATTLE_INTEL_LEN = 12

export async function submitBattleIntel(quest, battleIntel) {
  const text = String(battleIntel || '').trim()
  if (text.length < MIN_BATTLE_INTEL_LEN) {
    throw new Error('Battle Intel must be at least a short concrete summary.')
  }

  return updateQuestRow(quest.id, {
    status: QUEST_STATUS.ASSESSMENT_PENDING,
    assessment_status: QUEST_ASSESSMENT_STATUS.PENDING,
    battle_intel: text,
    battle_intel_at: new Date().toISOString(),
    started_at: quest.started_at || new Date().toISOString(),
    analysis_snapshot: {
      ...(quest.analysis_snapshot || {}),
      battle_intel: text,
      context: quest.context_note || quest.analysis_snapshot?.context || '',
    },
  })
}

export async function generateQuestAssessment(quest) {
  const intel = quest.battle_intel || quest.analysis_snapshot?.battle_intel || ''
  const raw = await invokeQuestAssessmentGenerate({
    title: quest.title,
    context: intel,
    battleIntel: intel,
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
    const tz = getProfileTimezone(profile)
    const firstDailyToday =
      quest.period !== QUEST_PERIODS.DAILY ||
      !(await hasCompletedDailyOnYmd(getTodayYmdInTimezone(tz)))

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
    if (firstDailyToday) await bumpDailyStreak(profile)
    if (quest.source_type === QUEST_SOURCE_TYPES.CURIOSITY) {
      const track = quest.curiosity_track || quest.analysis_snapshot?.curiosity_track
      if (track === CURIOSITY_TRACK.WEEK_WRAP_UP) {
        await onCuriosityWrapUpPassed(profile, quest)
      }
    } else {
      await applyTaskPoolOutcomeOnQuestSuccess(quest)
      if (!quest.is_micro && !quest.recall_source_quest_id) {
        await scheduleRecallAfterLearningPass({ ...quest, ...row, battle_intel: quest.battle_intel })
      }
    }
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
