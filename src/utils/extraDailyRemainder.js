import { QUEST_LOAD_POINTS } from '@/constants/questBudget'

/** How much day is left — drives max load for on-demand extra dailies. */
export const EXTRA_DAILY_REMAINDER_TIER = {
  FULL: 'full',
  MODERATE: 'moderate',
  LIGHT: 'light',
  WIND_DOWN: 'wind_down',
}

const TIER_BY_HOUR = [
  { until: 5, tier: EXTRA_DAILY_REMAINDER_TIER.WIND_DOWN },
  { until: 14, tier: EXTRA_DAILY_REMAINDER_TIER.FULL },
  { until: 18, tier: EXTRA_DAILY_REMAINDER_TIER.MODERATE },
  { until: 22, tier: EXTRA_DAILY_REMAINDER_TIER.LIGHT },
  { until: 24, tier: EXTRA_DAILY_REMAINDER_TIER.WIND_DOWN },
]

const TIER_CONFIG = {
  [EXTRA_DAILY_REMAINDER_TIER.FULL]: {
    maxLoadPoints: QUEST_LOAD_POINTS.hard,
    allowedDifficulties: ['easy', 'medium', 'hard'],
    label: 'Plenty of day left — normal pool picks OK.',
  },
  [EXTRA_DAILY_REMAINDER_TIER.MODERATE]: {
    maxLoadPoints: QUEST_LOAD_POINTS.medium,
    allowedDifficulties: ['easy', 'medium'],
    label: 'Afternoon — medium at most.',
  },
  [EXTRA_DAILY_REMAINDER_TIER.LIGHT]: {
    maxLoadPoints: QUEST_LOAD_POINTS.medium,
    allowedDifficulties: ['easy', 'medium'],
    label: 'Evening — keep it manageable.',
  },
  [EXTRA_DAILY_REMAINDER_TIER.WIND_DOWN]: {
    maxLoadPoints: QUEST_LOAD_POINTS.easy,
    allowedDifficulties: ['easy'],
    label: 'Day almost over — light task only.',
  },
}

export function getLocalHourInTimezone(timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date())
  return Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
}

export function getExtraDailyRemainderWindow(timeZone) {
  const hour = getLocalHourInTimezone(timeZone)
  const tier = TIER_BY_HOUR.find((row) => hour < row.until)?.tier ?? EXTRA_DAILY_REMAINDER_TIER.WIND_DOWN
  const hoursUntilMidnight = hour >= 5 ? 24 - hour : 5 - hour
  return {
    hour,
    tier,
    hoursUntilMidnight,
    ...TIER_CONFIG[tier],
  }
}

export function candidateFitsRemainderWindow(candidate, window) {
  const load = Number(candidate.loadPoints ?? 0)
  if (load > window.maxLoadPoints) return false
  const difficulty = candidate.difficulty || 'medium'
  return window.allowedDifficulties.includes(difficulty)
}
