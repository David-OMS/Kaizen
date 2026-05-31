import { QUEST_SOURCE_TYPES } from '@/constants/questEngine'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { QUEST_KIND } from '@/constants/questLifecycle'
import { invokePickSundayMentalQuest } from '@/services/sundayMentalAiService'
import { createQuestEntries, getQuestsForAssignedDate } from '@/services/questService'
import { getQuestDueDate, getQuestRewards } from '@/utils/quest'
import {
  isSundayMentalQuest,
  isSundayYmd,
  shouldAddSundayMentalQuest,
  SUNDAY_MENTAL_LOAD_POINTS,
} from '@/utils/sundayProvision'

export async function provisionSundayMentalQuestForToday({ profile, todayYmd, packed = [] }) {
  if (!isSundayYmd(todayYmd)) return []
  if (!shouldAddSundayMentalQuest(packed)) return []

  const existing = await getQuestsForAssignedDate(todayYmd, QUEST_PERIODS.DAILY)
  if (existing.some(isSundayMentalQuest)) return []

  const picked = await invokePickSundayMentalQuest({ profile })
  const xp = getQuestRewards(QUEST_PERIODS.DAILY)

  return createQuestEntries([
    {
      title: picked.title,
      period: QUEST_PERIODS.DAILY,
      assignedDate: todayYmd,
      dueDate: getQuestDueDate(QUEST_PERIODS.DAILY),
      xpReward: xp.reward,
      xpPenalty: xp.penalty,
      sourceType: QUEST_SOURCE_TYPES.SYSTEM_GENERATED,
      difficulty: 'easy',
      fearLevel: 1,
      questKind: QUEST_KIND.EXECUTION,
      loadPoints: SUNDAY_MENTAL_LOAD_POINTS,
      analysisSnapshot: {
        sunday_mental: true,
        journal_prompt: picked.journalPrompt,
      },
      accepted: true,
    },
  ])
}
