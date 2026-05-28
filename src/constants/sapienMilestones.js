/**
 * Per-habit streak milestones. AI names unlocks; xpBonus scales by tier.
 * tier guides naming tone in sapienMilestoneService.
 */
export const SAPIEN_MILESTONE_TIERS = {
  SPARK: 'spark',
  EMBER: 'ember',
  FORGE: 'forge',
  OATH: 'oath',
  TEMPLE: 'temple',
  LEGEND: 'legend',
  MYTHIC: 'mythic',
}

export const SAPIEN_TIER_NAMING_HINT = {
  [SAPIEN_MILESTONE_TIERS.SPARK]: 'First sparks — showing up at the start.',
  [SAPIEN_MILESTONE_TIERS.EMBER]: 'First weeks — consistency is forming.',
  [SAPIEN_MILESTONE_TIERS.FORGE]: 'Habit groove — about a month of discipline.',
  [SAPIEN_MILESTONE_TIERS.OATH]: 'Serious oath — multi-month unbroken chain.',
  [SAPIEN_MILESTONE_TIERS.TEMPLE]: 'Temple discipline — identity-level habit.',
  [SAPIEN_MILESTONE_TIERS.LEGEND]: 'Legendary arc — hundreds of days.',
  [SAPIEN_MILESTONE_TIERS.MYTHIC]: 'Mythic capstone — year-plus devotion.',
}

export const SAPIEN_STREAK_MILESTONES = [
  { days: 1, xpBonus: 8, tier: SAPIEN_MILESTONE_TIERS.SPARK },
  { days: 2, xpBonus: 12, tier: SAPIEN_MILESTONE_TIERS.SPARK },
  { days: 3, xpBonus: 20, tier: SAPIEN_MILESTONE_TIERS.SPARK },
  { days: 5, xpBonus: 28, tier: SAPIEN_MILESTONE_TIERS.SPARK },
  { days: 7, xpBonus: 50, tier: SAPIEN_MILESTONE_TIERS.EMBER },
  { days: 10, xpBonus: 65, tier: SAPIEN_MILESTONE_TIERS.EMBER },
  { days: 12, xpBonus: 75, tier: SAPIEN_MILESTONE_TIERS.EMBER },
  { days: 14, xpBonus: 95, tier: SAPIEN_MILESTONE_TIERS.EMBER },
  { days: 21, xpBonus: 125, tier: SAPIEN_MILESTONE_TIERS.FORGE },
  { days: 25, xpBonus: 140, tier: SAPIEN_MILESTONE_TIERS.FORGE },
  { days: 30, xpBonus: 220, tier: SAPIEN_MILESTONE_TIERS.FORGE },
  { days: 40, xpBonus: 270, tier: SAPIEN_MILESTONE_TIERS.FORGE },
  { days: 45, xpBonus: 300, tier: SAPIEN_MILESTONE_TIERS.FORGE },
  { days: 50, xpBonus: 330, tier: SAPIEN_MILESTONE_TIERS.OATH },
  { days: 60, xpBonus: 390, tier: SAPIEN_MILESTONE_TIERS.OATH },
  { days: 75, xpBonus: 460, tier: SAPIEN_MILESTONE_TIERS.OATH },
  { days: 90, xpBonus: 540, tier: SAPIEN_MILESTONE_TIERS.OATH },
  { days: 100, xpBonus: 620, tier: SAPIEN_MILESTONE_TIERS.TEMPLE },
  { days: 120, xpBonus: 700, tier: SAPIEN_MILESTONE_TIERS.TEMPLE },
  { days: 150, xpBonus: 820, tier: SAPIEN_MILESTONE_TIERS.TEMPLE },
  { days: 180, xpBonus: 950, tier: SAPIEN_MILESTONE_TIERS.TEMPLE },
  { days: 200, xpBonus: 1050, tier: SAPIEN_MILESTONE_TIERS.LEGEND },
  { days: 250, xpBonus: 1250, tier: SAPIEN_MILESTONE_TIERS.LEGEND },
  { days: 300, xpBonus: 1450, tier: SAPIEN_MILESTONE_TIERS.LEGEND },
  { days: 365, xpBonus: 2100, tier: SAPIEN_MILESTONE_TIERS.MYTHIC },
  { days: 500, xpBonus: 2900, tier: SAPIEN_MILESTONE_TIERS.MYTHIC },
  { days: 730, xpBonus: 4200, tier: SAPIEN_MILESTONE_TIERS.MYTHIC },
]

export function sapienMilestoneCatalogKey(habitId, days) {
  return `SAPIEN_STREAK_${days}_${habitId}`
}

export function getSapienMilestoneByDays(days) {
  return SAPIEN_STREAK_MILESTONES.find((m) => m.days === days) ?? null
}

export function getNextSapienMilestone(streakCurrent) {
  return SAPIEN_STREAK_MILESTONES.find((m) => m.days > streakCurrent) ?? null
}

export function milestonesDueForStreak(streakCurrent, unlockedDaysSet) {
  return SAPIEN_STREAK_MILESTONES.filter(
    (m) => streakCurrent >= m.days && !unlockedDaysSet.has(m.days),
  )
}
