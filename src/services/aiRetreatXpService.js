import { AI_EDGE_FUNCTIONS } from '@/constants/aiAnalysis'
import { RAID_RETREAT_XP_MAX } from '@/constants/raidBattleStatuses'
import { supabase } from '@/services/supabase'

const FALLBACK = {
  xpAward: 12,
  systemMessage: 'The System logged a retreat. Experience noted.',
  effortTier: 'moderate',
  fallbackUsed: true,
}

export async function invokeScoreBattleRetreat(payload) {
  const { data, error } = await supabase.functions.invoke(AI_EDGE_FUNCTIONS.SCORE_BATTLE_RETREAT, {
    body: payload,
  })

  if (error || !data?.score) {
    return { ...FALLBACK, model: null }
  }

  const xp = Math.min(RAID_RETREAT_XP_MAX, Math.max(0, Number(data.score.xpAward || 0)))
  return {
    xpAward: xp,
    systemMessage: data.score.systemMessage || FALLBACK.systemMessage,
    effortTier: data.score.effortTier || FALLBACK.effortTier,
    fallbackUsed: Boolean(data.fallbackUsed),
    model: data.model ?? null,
  }
}
