import { RANK_ORDER } from '@/constants/gamification'
import { getProfile } from '@/services/profileService'
import { fetchProgressionMetrics } from '@/services/progressionService'
import { deriveLevel, deriveRankFromLevel } from '@/utils/xpEngine'
import { evaluateRankGate } from '@/utils/rankGates'

/**
 * Read-only audit: level-derived rank vs gates vs live metrics.
 * Used for Phase 8 manual gate validation in the UI.
 */
export async function fetchRankGateAudit() {
  const profile = await getProfile()
  const totalXp = Number(profile.total_xp ?? profile.xp ?? 0)
  const level = deriveLevel(totalXp)
  const derived = deriveRankFromLevel(level)
  const metrics = await fetchProgressionMetrics(profile)

  const currentIdx = RANK_ORDER.indexOf(profile.rank)
  const derivedIdx = RANK_ORDER.indexOf(derived.key)

  let promotion = null
  if (derivedIdx > currentIdx) {
    const gate = evaluateRankGate(derived.key, metrics)
    promotion = {
      targetRank: derived.key,
      targetTitle: derived.title,
      gate,
    }
  }

  return {
    totalXp,
    level,
    currentRank: profile.rank,
    currentTitle: profile.title,
    derivedRank: derived.key,
    derivedTitle: derived.title,
    metrics,
    promotion,
    demotionWouldApply: derivedIdx < currentIdx,
  }
}
