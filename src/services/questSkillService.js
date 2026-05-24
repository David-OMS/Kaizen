import { applySkillXpDelta } from '@/services/skillsService'
import { splitQuestSkillXpReward } from '@/utils/skillProgress'

/** Quest complete → optional skill XP from quest XP reward budget (low-noise mapping). */
export async function applyQuestCompletionSkillGrants(quest) {
  const primary = quest.primary_skill_id ?? null
  const secondary = quest.secondary_skill_id ?? null
  const reward = Number(quest.xp_reward || 0)

  const slices = splitQuestSkillXpReward(reward, primary, secondary)

  for (const slice of slices) {
    if (slice.amount > 0) {
      await applySkillXpDelta(slice.skillId, slice.amount)
    }
  }
}
