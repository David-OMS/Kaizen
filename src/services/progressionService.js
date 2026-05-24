import { LEVEL_RANKS, RANK_ORDER } from '@/constants/xpEngine'
import { getProfile, updateProfileProgress } from '@/services/profileService'
import { supabase } from '@/services/supabase'
import { applyRankCap, evaluateRankGate, rankIndex } from '@/utils/rankGateEvaluator'
import { deriveLevel, deriveRankFromLevel } from '@/utils/xpEngine'

async function getEverSignedRaidCount() {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .in('status', ['ongoing', 'completed'])

  if (error) throw error
  return count ?? 0
}

async function getHuntCount() {
  const { count, error } = await supabase.from('reachouts').select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

async function getDungeonCompletedCount() {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .in('status', ['completed', 'lost'])

  if (error) throw error
  return count ?? 0
}

export async function collectRankGateMetrics(profile) {
  const [raidsSigned, huntsLogged, dungeonsCompleted] = await Promise.all([
    getEverSignedRaidCount(),
    getHuntCount(),
    getDungeonCompletedCount(),
  ])

  return {
    raidsSigned,
    huntsLogged,
    dungeonsCompleted,
    streakPeak: Number(profile.streak_best || 0),
    monthlyIncomeNgn: 0,
  }
}

function isRankAtLeast(rankKey, minimumRank) {
  return rankIndex(rankKey) >= rankIndex(minimumRank)
}

/**
 * Highest rank allowed by level + passed gates; then apply profile.rank_cap (default D).
 */
export async function syncProfileProgression(totalXp, rankOrder = RANK_ORDER) {
  const profile = await getProfile()
  const level = deriveLevel(totalXp)
  const levelRank = deriveRankFromLevel(level)
  const metrics = await collectRankGateMetrics(profile)

  let rank = profile.rank
  let title = profile.title
  const currentIdx = Math.max(0, rankOrder.indexOf(profile.rank))
  const levelIdx = Math.max(0, rankOrder.indexOf(levelRank.key))

  if (levelIdx < currentIdx) {
    rank = levelRank.key
    title = levelRank.title
  } else if (levelIdx > currentIdx) {
    const gate = evaluateRankGate(levelRank.key, metrics)
    if (gate.passed) {
      rank = levelRank.key
      title = levelRank.title
    }
  }

  rank = applyRankCap(rank, profile.rank_cap)

  const cappedMeta = LEVEL_RANKS.find((r) => r.key === rank)
  if (cappedMeta) title = cappedMeta.title

  await updateProfileProgress({ level, rank, title })

  if (rank !== profile.rank) {
    const { unlockLockedContentForRank, runRankSurpriseChecks } = await import(
      '@/services/gamificationService.js'
    )
    await unlockLockedContentForRank(rank)
    await runRankSurpriseChecks()
  }

  return { level, rank, title, metrics }
}

export async function reconcileProfileXp() {
  const { data, error } = await supabase.rpc('reconcile_profile_xp')
  if (error) throw error
  const result = await syncProfileProgression(Number(data))
  return { totalXp: Number(data), ...result }
}

/** @alias reconcileProfileXp — hook name */
export const reconcileProfileXpFromLog = reconcileProfileXp

/** @alias collectRankGateMetrics — rank gate audit */
export const fetchProgressionMetrics = collectRankGateMetrics
