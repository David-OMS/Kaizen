import { ARC_DAILY_SUPPORT_MAX, ARC_DAILY_SUPPORT_MIN } from '@/constants/skillArcMetadata'

export function validateArcQuestLinks(weeklyQuestId, dailyQuestIds) {
  if (!weeklyQuestId) {
    return { ok: false, message: 'Select the weekly anchor quest.' }
  }
  const ids = Array.isArray(dailyQuestIds) ? dailyQuestIds.filter(Boolean) : []
  if (ids.length < ARC_DAILY_SUPPORT_MIN) {
    return { ok: false, message: `Pick at least ${ARC_DAILY_SUPPORT_MIN} daily support quests.` }
  }
  if (ids.length > ARC_DAILY_SUPPORT_MAX) {
    return { ok: false, message: `At most ${ARC_DAILY_SUPPORT_MAX} daily support quests.` }
  }
  if (ids.includes(weeklyQuestId)) {
    return { ok: false, message: 'Weekly anchor cannot be in the daily list.' }
  }
  return { ok: true }
}
