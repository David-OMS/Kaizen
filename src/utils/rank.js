import { RANKS } from '@/constants/ranks'

export function getRankFromXp(xp) {
  return (
    RANKS.find((rank) => xp >= rank.minXp && (rank.maxXp === null || xp <= rank.maxXp)) ??
    RANKS[0]
  )
}

export function getProgressToNextRank(xp) {
  const currentRank = getRankFromXp(xp)
  const currentIndex = RANKS.findIndex((rank) => rank.key === currentRank.key)
  const nextRank = RANKS[currentIndex + 1]

  if (!nextRank) {
    return { percentage: 100, nextRankLabel: 'MAX RANK', remainingXp: 0 }
  }

  const segmentStart = currentRank.minXp
  const segmentSize = nextRank.minXp - segmentStart
  const progress = xp - segmentStart
  const percentage = Math.min(100, Math.floor((progress / segmentSize) * 100))

  return {
    percentage,
    nextRankLabel: `${nextRank.key} Rank`,
    remainingXp: Math.max(0, nextRank.minXp - xp),
  }
}