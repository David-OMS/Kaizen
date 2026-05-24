import { RAID_RANK_MULTIPLIER } from '@/constants/raidRanks'

export function getRankScaledXp(baseXp, raidRank) {
  const multiplier = RAID_RANK_MULTIPLIER[raidRank] ?? 1
  return Math.round(baseXp * multiplier)
}