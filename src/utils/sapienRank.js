import { SAPIEN_RANKS } from '@/constants/sapienRanks'

export function deriveSapienRankFromXp(xp) {
  const total = Math.max(0, Number(xp) || 0)
  let current = SAPIEN_RANKS[0]
  for (const row of SAPIEN_RANKS) {
    if (total >= row.minXp) current = row
  }
  const idx = SAPIEN_RANKS.indexOf(current)
  const next = SAPIEN_RANKS[idx + 1]
  return {
    rank: current,
    level: idx + 1,
    nextRank: next ?? null,
    xpToNext: next ? Math.max(0, next.minXp - total) : 0,
    progressPct: next
      ? Math.min(100, Math.round(((total - current.minXp) / (next.minXp - current.minXp)) * 100))
      : 100,
  }
}
