import { LEVEL_RANKS, XP_ENGINE } from '@/constants/xpEngine'

function getMultiplier(table, key, fallback) {
  return table[key] ?? fallback
}

export function calculateXP({
  activityType,
  difficulty = 'medium',
  fearLevel = 1,
  speed = 'on_time',
  quality = 'good',
  currentStreak = 0,
  bonusXp = 0,
  /** Hunts/quests only — raids pass false (project difficulty, not founder fear). */
  applyFearMultiplier = true,
}) {
  const base = XP_ENGINE.baseXp[activityType] ?? 0
  const difficultyMultiplier = getMultiplier(XP_ENGINE.difficultyMultiplier, difficulty, 1)
  const fearMultiplier = applyFearMultiplier
    ? getMultiplier(XP_ENGINE.fearMultiplier, fearLevel, 1)
    : 1
  const speedMultiplier = getMultiplier(XP_ENGINE.speedMultiplier, speed, 1)
  const qualityMultiplier = getMultiplier(XP_ENGINE.qualityMultiplier, quality, 1)

  const streakMultiplier = Math.min(
    XP_ENGINE.streak.maxMultiplier,
    1 + Number(currentStreak || 0) * XP_ENGINE.streak.perDayBonus,
  )

  const total =
    base * difficultyMultiplier * fearMultiplier * speedMultiplier * qualityMultiplier * streakMultiplier +
    Number(bonusXp || 0)

  return Math.round(total)
}

export function xpToReachLevel(level) {
  const safeLevel = Math.max(1, Number(level || 1))
  return Math.round(XP_ENGINE.level.coefficient * safeLevel ** XP_ENGINE.level.exponent)
}

export function deriveLevel(totalXp) {
  const safeTotalXp = Math.max(0, Number(totalXp || 0))
  let level = 1

  while (safeTotalXp >= xpToReachLevel(level + 1)) {
    level += 1
  }

  return level
}

export function deriveRankFromLevel(level) {
  return (
    LEVEL_RANKS.find(
      (rank) => level >= rank.minLevel && (rank.maxLevel === null || level <= rank.maxLevel),
    ) ?? LEVEL_RANKS[0]
  )
}

export function getProgressToNextLevel(totalXp) {
  const level = deriveLevel(totalXp)
  const currentThreshold = xpToReachLevel(level)
  const nextThreshold = xpToReachLevel(level + 1)
  const inLevelXp = Math.max(0, totalXp - currentThreshold)
  const span = Math.max(1, nextThreshold - currentThreshold)
  const percentage = Math.min(100, Math.floor((inLevelXp / span) * 100))

  return {
    level,
    currentThreshold,
    nextThreshold,
    inLevelXp,
    remainingXp: Math.max(0, nextThreshold - totalXp),
    percentage,
  }
}
