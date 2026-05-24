import { XP_EVENT_TYPES } from '@/constants/xpEvents'

/** XP penalty when rejecting a system-generated daily (Phase 5). */
export const SYSTEM_QUEST_REJECT_XP = -18

export const SYSTEM_QUEST_REJECT_EVENT = XP_EVENT_TYPES.SYSTEM_QUEST_REJECTED

/** localStorage: one dismiss per user per calendar day (no migration). */
export function getDailyBriefingStorageKey(userId, ymd) {
  return `soloLeveling.dailyBriefing:${userId}:${ymd}`
}
