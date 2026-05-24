import { HUNT_FINAL_OUTCOME_OPTIONS } from '@/constants/huntOutcomes'

export const RAID_STATUS_OPTIONS = ['pending', 'ongoing', 'completed', 'failed']

/** @deprecated use RAID_STATUS_OPTIONS */
export const CLIENT_STATUS_OPTIONS = RAID_STATUS_OPTIONS

/** @deprecated */
export const REACHOUT_RESPONSE_OPTIONS = HUNT_FINAL_OUTCOME_OPTIONS.map((o) => o.value)

export const REACHOUT_CHANNEL_OPTIONS = [
  'whatsapp',
  'email',
  'linkedin',
  'twitter',
  'referral',
  'call',
  'other',
]

export const HUNT_FEAR_MIN = 1
export const HUNT_FEAR_MAX = 5
export const HUNT_FEAR_DEFAULT = 3

export const HUNT_FEAR_OPTIONS = [1, 2, 3, 4, 5]

/** DB statuses after phase2 migration (canonical). */
export const RAID_DB_STATUSES = ['pending', 'ongoing', 'completed', 'failed']

/** Legacy DB statuses (pre–phase2). */
export const RAID_DB_STATUSES_LEGACY = ['pending', 'proposal', 'active', 'lost']

export function mapRaidUiStatusToDb(status) {
  const key = String(status || 'pending').toLowerCase()
  if (RAID_DB_STATUSES.includes(key)) return key
  if (key === 'ongoing') return 'active'
  if (key === 'completed') return 'lost'
  return 'pending'
}

export function normalizeRaidRank(rank) {
  return String(rank || 'E').toUpperCase()
}

export function mapDbStatusToRaidUi(status) {
  const key = String(status || 'pending').toLowerCase()
  if (RAID_DB_STATUSES.includes(key)) return key
  if (key === 'active') return 'ongoing'
  if (key === 'lost') return 'completed'
  if (key === 'proposal') return 'pending'
  return 'pending'
}

/** Status values that count as an active raid slot (phase2 + legacy). */
export const RAID_DB_ONGOING_STATUSES = ['ongoing', 'active']

/** Status values for completed raids in metrics (phase2 + legacy). */
export const RAID_DB_COMPLETED_STATUSES = ['completed', 'lost']

export { getHuntOutcomeLabel as mapResponseStatusToHuntLabel } from '@/constants/huntOutcomes'