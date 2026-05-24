/** Hunt outcome keys on reachouts.response_status */

export const HUNT_OUTCOME = {
  PENDING: 'pending',
  SUCCESSFUL: 'successful',
  REJECTED: 'rejected',
  GHOSTED: 'ghosted',
}

const LEGACY_OUTCOME_MAP = {
  no_reply: HUNT_OUTCOME.PENDING,
  active: HUNT_OUTCOME.PENDING,
  interested: HUNT_OUTCOME.SUCCESSFUL,
  engaged: HUNT_OUTCOME.SUCCESSFUL,
  declined: HUNT_OUTCOME.REJECTED,
  rejected: HUNT_OUTCOME.REJECTED,
  ghosted: HUNT_OUTCOME.GHOSTED,
  cold: HUNT_OUTCOME.GHOSTED,
}

export const HUNT_FINAL_OUTCOME_OPTIONS = [
  {
    value: HUNT_OUTCOME.SUCCESSFUL,
    label: 'Successful',
    hint: 'Positive response — raid door is open',
  },
  {
    value: HUNT_OUTCOME.REJECTED,
    label: 'Rejected',
    hint: 'Clear no',
  },
  {
    value: HUNT_OUTCOME.GHOSTED,
    label: 'Ghosted',
    hint: 'No meaningful response',
  },
]

export function normalizeHuntOutcome(status) {
  if (!status) return HUNT_OUTCOME.PENDING
  return LEGACY_OUTCOME_MAP[status] ?? status
}

export function getHuntOutcomeLabel(status) {
  const key = normalizeHuntOutcome(status)
  if (key === HUNT_OUTCOME.PENDING) return 'Pending'
  return HUNT_FINAL_OUTCOME_OPTIONS.find((o) => o.value === key)?.label ?? key
}

export function isHuntPending(status) {
  return normalizeHuntOutcome(status) === HUNT_OUTCOME.PENDING
}

export function isHuntSuccessful(status) {
  return normalizeHuntOutcome(status) === HUNT_OUTCOME.SUCCESSFUL
}

/** @deprecated use isHuntSuccessful */
export function isHuntEngaged(status) {
  return isHuntSuccessful(status)
}

export function isHuntDeclined(status) {
  return normalizeHuntOutcome(status) === HUNT_OUTCOME.REJECTED
}

export function isHuntGhosted(status) {
  return normalizeHuntOutcome(status) === HUNT_OUTCOME.GHOSTED
}
