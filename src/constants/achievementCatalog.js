/** Maps + helpers for achievements. Row definitions: achievementMilestoneDefinitions.js */

import { ACHIEVEMENT_MILESTONE_DEFS } from '@/constants/achievementMilestoneDefinitions'

export { ACHIEVEMENT_CATEGORIES } from '@/constants/achievementTypes'

export const ACHIEVEMENT_DEFS = ACHIEVEMENT_MILESTONE_DEFS

export const ACHIEVEMENT_BY_KEY = Object.fromEntries(ACHIEVEMENT_DEFS.map((d) => [d.key, d]))

export const LEGACY_TITLE_TO_KEY = Object.fromEntries(
  ACHIEVEMENT_DEFS.map((d) => [d.legacyTitle, d.key]),
)

/** @deprecated use ACHIEVEMENT_KEYS — values are catalog keys */
export const ACHIEVEMENT_TITLES = Object.fromEntries(ACHIEVEMENT_DEFS.map((d) => [d.key, d.key]))

export const ACHIEVEMENT_KEYS = ACHIEVEMENT_TITLES

export function getAchievementDefByKey(catalogKey) {
  return ACHIEVEMENT_BY_KEY[catalogKey] ?? null
}

export function getAchievementDefByLegacyTitle(title) {
  const key = LEGACY_TITLE_TO_KEY[title]
  return key ? ACHIEVEMENT_BY_KEY[key] : null
}

export function isSecretAchievementRow(achievement) {
  const def = achievement?.catalog_key
    ? getAchievementDefByKey(achievement.catalog_key)
    : getAchievementDefByLegacyTitle(achievement?.title)
  return def?.secret !== false
}
