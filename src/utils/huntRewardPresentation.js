import { XP_EVENT_TYPES } from '@/constants/xpEvents'
import { getHuntOutcomeLabel } from '@/constants/huntOutcomes'

export function buildHuntLaunchReward({ xp, contactName }) {
  return {
    title: 'Hunt launched',
    headline: 'Reach registered',
    xp,
    eventType: XP_EVENT_TYPES.HUNT_LAUNCHED,
    flavor: `The System logged your move on ${contactName}.`,
  }
}

export function buildHuntOutcomeReward({ xp, outcome, contactName }) {
  const label = getHuntOutcomeLabel(outcome)
  const flavorByOutcome = {
    successful: 'A door opened. Press the advantage.',
    rejected: 'Data logged. Resilience XP granted.',
    ghosted: 'Silence noted. The field still teaches.',
  }
  const key = String(outcome || '').toLowerCase()
  return {
    title: 'Outcome resolved',
    headline: label,
    xp,
    eventType:
      key === 'successful'
        ? XP_EVENT_TYPES.HUNT_OUTCOME_SUCCESSFUL
        : key === 'rejected'
          ? XP_EVENT_TYPES.HUNT_OUTCOME_REJECTED
          : XP_EVENT_TYPES.HUNT_OUTCOME_GHOSTED,
    flavor: flavorByOutcome[key] ?? `Outcome locked for ${contactName}.`,
  }
}
