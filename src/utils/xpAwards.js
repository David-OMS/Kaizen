import {
  RAID_COMPLETE_XP_FACTOR,
  RAID_COMPLETE_XP_FLOOR,
  RAID_START_XP_FACTOR,
  RAID_START_XP_FLOOR,
} from '@/constants/xpEngine'
import { calculateXP } from '@/utils/xpEngine'

function getDifficultyFromRaidRank(raidRank) {
  switch (raidRank) {
    case 'S':
      return 'legendary'
    case 'A':
      return 'hard'
    case 'B':
      return 'medium'
    default:
      return 'easy'
  }
}

export function getDifficultyFromRaidScore(difficultyScore) {
  if (difficultyScore == null || Number.isNaN(Number(difficultyScore))) return null
  const s = Math.min(100, Math.max(0, Number(difficultyScore)))
  if (s < 25) return 'easy'
  if (s < 50) return 'medium'
  if (s < 75) return 'hard'
  return 'legendary'
}

function baseRaidActionXp({ raidRank, difficultyScore, currentStreak = 0 }) {
  const difficulty = getDifficultyFromRaidScore(difficultyScore) ?? getDifficultyFromRaidRank(raidRank)
  return calculateXP({
    activityType: 'raid_action',
    difficulty,
    applyFearMultiplier: false,
    speed: 'on_time',
    quality: 'good',
    currentStreak,
  })
}

export function getRaidStartXp({ raidRank, difficultyScore, currentStreak = 0 }) {
  const full = baseRaidActionXp({ raidRank, difficultyScore, currentStreak })
  return Math.max(RAID_START_XP_FLOOR, Math.round(full * RAID_START_XP_FACTOR))
}

export function getRaidCompleteXp({ raidRank, difficultyScore, currentStreak = 0 }) {
  const full = baseRaidActionXp({ raidRank, difficultyScore, currentStreak })
  return Math.max(RAID_COMPLETE_XP_FLOOR, Math.round(full * RAID_COMPLETE_XP_FACTOR))
}

/** @deprecated use getRaidStartXp — kept for callers during migration */
export function getRaidStartXpLegacy(opts) {
  return getRaidStartXp(opts)
}

export function getHuntLaunchXp({ fearLevel = 1, currentStreak = 0 }) {
  return calculateXP({
    activityType: 'hunt',
    difficulty: 'easy',
    fearLevel,
    speed: 'on_time',
    quality: 'good',
    currentStreak,
  })
}

/** @deprecated use getHuntLaunchXp */
export function getHuntSentXp(opts) {
  return getHuntLaunchXp(opts)
}

export function getHuntOutcomeXp({ outcome, fearLevel = 1, currentStreak = 0 }) {
  const normalized = String(outcome || '').toLowerCase()
  const quality =
    normalized === 'successful'
      ? 'excellent'
      : normalized === 'rejected'
        ? 'partial'
        : 'failed'

  return calculateXP({
    activityType: 'hunt',
    difficulty: 'easy',
    fearLevel,
    speed: 'on_time',
    quality,
    currentStreak,
  })
}

/** @deprecated use getHuntOutcomeXp */
export function getHuntRejectionXp(opts) {
  return getHuntOutcomeXp({ ...opts, outcome: 'rejected' })
}

export function getInvoicePaidXp({ amount }) {
  const bonusXp = Math.min(250, Math.floor(Number(amount || 0) / 500))
  return calculateXP({
    activityType: 'raid_action',
    difficulty: 'medium',
    applyFearMultiplier: false,
    speed: 'on_time',
    quality: 'good',
    bonusXp,
  })
}
