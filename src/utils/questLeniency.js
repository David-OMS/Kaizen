import { QUEST_LENIENCY } from '@/constants/questBudget'

export function qualifiesForLeniency({ streakCurrent, completionRate }) {
  return (
    Number(streakCurrent ?? 0) >= QUEST_LENIENCY.minStreak &&
    Number(completionRate ?? 0) >= QUEST_LENIENCY.minCompletionRate
  )
}

/** Grace until 08:00 next calendar day (local browser; server uses TZ in close-day). */
export function buildGraceUntilNextMorning(fromDate = new Date()) {
  const d = new Date(fromDate)
  d.setDate(d.getDate() + 1)
  d.setHours(QUEST_LENIENCY.graceHourNextDay, 0, 0, 0)
  return d.toISOString()
}
