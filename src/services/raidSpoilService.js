import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { invokeNameRaidReward } from '@/services/aiRewardNamingService'
import { XP_EVENT_TYPES } from '@/constants/xpEvents'
import { addXP } from '@/services/xpService'
import { getSpoilXpForAmount } from '@/utils/moneyBandXp'

function buildNamingSnapshot(raw) {
  return {
    ritual_name: raw.naming.ritualName,
    ritual_tagline: raw.naming.ritualTagline,
    model: raw.model,
    fallback_used: raw.fallbackUsed,
  }
}

export async function listRaidSpoils(clientId) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('raid_spoils')
    .select('*')
    .eq('client_id', clientId)
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

function toRecordedAtIso(recordedAt) {
  if (!recordedAt) return new Date().toISOString()
  const day = String(recordedAt).slice(0, 10)
  return `${day}T12:00:00.000Z`
}

export async function createOneOffSpoil({ clientId, amount, workNote, recordedAt, battleId = null }) {
  const userId = await getAuthenticatedUserId()
  const { data: client, error: ce } = await supabase
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single()

  if (ce) throw ce

  const raw = await invokeNameRaidReward({
    kind: 'one_off',
    amount: Number(amount),
    purpose: workNote || 'One-off raid payment',
    clientName: client?.name ?? '',
  })

  const namingSnapshot = buildNamingSnapshot(raw)
  const spoilXp = getSpoilXpForAmount(amount)
  const recordedAtIso = toRecordedAtIso(recordedAt)

  const { data: row, error } = await supabase
    .from('raid_spoils')
    .insert({
      user_id: userId,
      client_id: clientId,
      battle_id: battleId,
      amount,
      work_note: workNote ?? '',
      ritual_name: raw.naming.ritualName,
      ritual_tagline: raw.naming.ritualTagline,
      naming_snapshot: namingSnapshot,
      battle_xp: spoilXp,
      recorded_at: recordedAtIso,
    })
    .select('*')
    .single()

  if (error) throw error

  if (spoilXp > 0) {
    await addXP(spoilXp, XP_EVENT_TYPES.RAID_BATTLE, `${row.ritual_name}: ${client?.name ?? 'Raid'} — ${workNote || 'spoil'}`, {
      presentation: {
        kind: 'reward',
        title: row.ritual_name,
        description: raw.naming.ritualTagline || workNote || 'Spoils secured.',
        category: 'spoil',
      },
    })
  }

  return row
}
