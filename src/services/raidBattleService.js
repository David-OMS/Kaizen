import { RAID_BATTLE_STATUS } from '@/constants/raidBattleStatuses'
import { XP_EVENT_TYPES } from '@/constants/xpEvents'
import { invokeScoreBattleRetreat } from '@/services/aiRetreatXpService'
import { createOneOffSpoil } from '@/services/raidSpoilService'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { addXP, enqueueXpRewardModal } from '@/services/xpService'

function toDateOnly(value) {
  if (!value) return new Date().toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

export async function listRaidBattles(clientId) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('raid_battles')
    .select('*')
    .eq('client_id', clientId)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function startRaidBattle({ clientId, battleName, scopeNote, startedAt, dueDate }) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('raid_battles')
    .insert({
      user_id: userId,
      client_id: clientId,
      battle_name: battleName.trim(),
      scope_note: scopeNote?.trim() || '',
      status: RAID_BATTLE_STATUS.IN_PROGRESS,
      started_at: toDateOnly(startedAt),
      due_date: dueDate ? toDateOnly(dueDate) : null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

async function getBattleForUser(battleId) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('raid_battles')
    .select('*')
    .eq('id', battleId)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

async function updateBattleForUser(battleId, userId, patch) {
  const { data, error } = await supabase
    .from('raid_battles')
    .update(patch)
    .eq('id', battleId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  if (!data) throw new Error('Battle update failed — no row returned.')
  return data
}

/** Battles with a linked spoil row but stale status (partial claim failure). */
export async function reconcileBattlesWithLinkedSpoils(battles, spoils) {
  const userId = await getAuthenticatedUserId()
  const open = [RAID_BATTLE_STATUS.IN_PROGRESS, RAID_BATTLE_STATUS.AWAITING_SPOIL]
  const battleIdsWithSpoil = new Set(
    (spoils ?? []).filter((s) => s.battle_id).map((s) => s.battle_id),
  )

  const next = [...battles]
  for (let i = 0; i < next.length; i += 1) {
    const battle = next[i]
    if (!open.includes(battle.status) || !battleIdsWithSpoil.has(battle.id)) continue
    try {
      next[i] = await updateBattleForUser(battle.id, userId, {
        status: RAID_BATTLE_STATUS.SPOILS_CLAIMED,
        delivered_at: battle.delivered_at ?? new Date().toISOString(),
      })
    } catch {
      /* keep stale row; next load can retry */
    }
  }
  return next
}

export async function markBattleDelivered(battleId) {
  const userId = await getAuthenticatedUserId()
  const battle = await getBattleForUser(battleId)
  if (battle.status !== RAID_BATTLE_STATUS.IN_PROGRESS) {
    throw new Error('Only in-progress battles can be marked delivered.')
  }

  return updateBattleForUser(battleId, userId, {
    status: RAID_BATTLE_STATUS.AWAITING_SPOIL,
    delivered_at: new Date().toISOString(),
  })
}

export async function retreatRaidBattle({ battleId, retreatNote, clientDirective }) {
  const note = retreatNote?.trim()
  if (!note) throw new Error('Retreat debrief is required.')

  const battle = await getBattleForUser(battleId)
  if (![RAID_BATTLE_STATUS.IN_PROGRESS, RAID_BATTLE_STATUS.AWAITING_SPOIL].includes(battle.status)) {
    throw new Error('This battle cannot be retreated.')
  }

  const score = await invokeScoreBattleRetreat({
    battleName: battle.battle_name,
    scopeNote: battle.scope_note,
    retreatNote: note,
    clientDirective: clientDirective?.trim() || '',
    startedAt: battle.started_at,
    dueDate: battle.due_date || '',
  })

  const snapshot = {
    xp_award: score.xpAward,
    system_message: score.systemMessage,
    effort_tier: score.effortTier,
    fallback_used: score.fallbackUsed,
    model: score.model,
  }

  const userId = await getAuthenticatedUserId()
  const data = await updateBattleForUser(battleId, userId, {
    status: RAID_BATTLE_STATUS.RETREATED,
    retreated_at: new Date().toISOString(),
    retreat_note: note,
    client_directive: clientDirective?.trim() || null,
    retreat_xp: score.xpAward,
    retreat_snapshot: snapshot,
  })

  const presentation = {
    kind: 'reward',
    title: `Retreat — ${battle.battle_name}`,
    description: score.systemMessage,
    category: 'raid',
    alwaysShow: true,
  }

  if (score.xpAward > 0) {
    await addXP(
      score.xpAward,
      XP_EVENT_TYPES.RAID_RETREAT,
      `Retreat — ${battle.battle_name}: ${score.systemMessage}`,
      { presentation },
    )
  } else {
    enqueueXpRewardModal(presentation)
  }

  return { battle: data, score }
}

export async function claimBattleSpoil({ battleId, amount, workNote, recordedAt }) {
  const userId = await getAuthenticatedUserId()
  const battle = await getBattleForUser(battleId)
  if (![RAID_BATTLE_STATUS.IN_PROGRESS, RAID_BATTLE_STATUS.AWAITING_SPOIL].includes(battle.status)) {
    throw new Error('Spoils can only be claimed on open battles.')
  }

  const previousStatus = battle.status
  const previousDeliveredAt = battle.delivered_at

  const updatedBattle = await updateBattleForUser(battleId, userId, {
    status: RAID_BATTLE_STATUS.SPOILS_CLAIMED,
    delivered_at: battle.delivered_at ?? new Date().toISOString(),
  })

  try {
    const spoil = await createOneOffSpoil({
      clientId: battle.client_id,
      battleId: battle.id,
      amount,
      workNote: workNote || battle.scope_note,
      recordedAt,
    })
    return { battle: updatedBattle, spoil }
  } catch (err) {
    await updateBattleForUser(battleId, userId, {
      status: previousStatus,
      delivered_at: previousDeliveredAt,
    })
    throw err
  }
}
