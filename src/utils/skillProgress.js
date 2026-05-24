import { SKILL_QUEST_SPLIT, SKILL_XP_PER_LEVEL } from '@/constants/skillsEngine'

export function skillLevelFromXp(skillXp) {
  const xp = Math.max(0, Number(skillXp || 0))
  return Math.floor(xp / SKILL_XP_PER_LEVEL)
}

/**
 * Optional primary + optional secondary; amounts derive from the quest XP reward budget.
 * @returns {{ skillId: string, amount: number }[]}
 */
export function splitQuestSkillXpReward(baseReward, primarySkillId, secondarySkillId) {
  const budget = Math.max(0, Math.round(Number(baseReward || 0)))
  if (!budget || !primarySkillId) return []

  if (!secondarySkillId) {
    return [{ skillId: primarySkillId, amount: budget }]
  }

  const primaryAmount = Math.round(budget * SKILL_QUEST_SPLIT.primaryWithSecondary)
  const secondaryAmount = Math.max(0, budget - primaryAmount)

  return [
    { skillId: primarySkillId, amount: primaryAmount },
    { skillId: secondarySkillId, amount: secondaryAmount },
  ]
}
