import { SKILL_CATALOG_KEYS } from '@/constants/skillCatalog'

/** Curated catalog keys (builder + founder tracks). */
export const CORE_SKILL_KEYS = SKILL_CATALOG_KEYS

/** Plan: skillLevel = floor(skillXp / 500) */
export const SKILL_XP_PER_LEVEL = 500

/** When a quest maps to skills, split quest XP reward (not profile formula) into skill XP. */
export const SKILL_QUEST_SPLIT = {
  primaryOnly: 1,
  primaryWithSecondary: 0.7,
  secondary: 0.3,
}

/** At most one arc in these states at a time (MVP). */
export const ARC_ACTIVE_STATUSES = ['accepted', 'active', 'verification']

export const MAX_ACTIVE_SKILL_ARCS = 1
