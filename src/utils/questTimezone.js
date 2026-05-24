import { QUEST_DEFAULT_TIMEZONE, QUEST_PROVISION_HOUR } from '@/constants/questBudget'

export function getProfileTimezone(profile) {
  return profile?.quest_timezone || QUEST_DEFAULT_TIMEZONE
}

/** YYYY-MM-DD in profile TZ (approx via Intl). */
export function getTodayYmdInTimezone(timeZone = QUEST_DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function getYesterdayYmdInTimezone(timeZone = QUEST_DEFAULT_TIMEZONE) {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** Whether local provision hour (05:00) has passed today in TZ. */
export function isProvisionWindowOpen(timeZone = QUEST_DEFAULT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date())
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  return hour >= QUEST_PROVISION_HOUR
}
