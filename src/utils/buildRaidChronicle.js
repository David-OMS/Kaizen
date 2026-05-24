import { RAID_BATTLE_STATUS } from '@/constants/raidBattleStatuses'

function ts(value) {
  if (!value) return 0
  return new Date(value).getTime()
}

function pushEvent(events, event) {
  events.push(event)
}

/** Compact timeline only — no duplicate of briefing text or battle scope. */
export function buildRaidChronicle({ client, battles = [], spoils = [], accruals = [] }) {
  const events = []

  if (client?.created_at) {
    pushEvent(events, {
      id: `raid-created-${client.id}`,
      at: client.created_at,
      kind: 'raid_created',
      title: 'Raid registered',
      body: client.project_name || client.name,
    })
  }

  for (const battle of battles) {
    pushEvent(events, {
      id: `battle-start-${battle.id}`,
      at: battle.started_at,
      kind: 'battle_started',
      title: `Battle started — ${battle.battle_name}`,
    })

    if (battle.delivered_at && battle.status !== RAID_BATTLE_STATUS.RETREATED) {
      pushEvent(events, {
        id: `battle-delivered-${battle.id}`,
        at: battle.delivered_at,
        kind: 'battle_delivered',
        title: `Delivery sealed — ${battle.battle_name}`,
      })
    }

    if (battle.status === RAID_BATTLE_STATUS.SPOILS_CLAIMED) {
      pushEvent(events, {
        id: `battle-spoils-${battle.id}`,
        at: battle.updated_at || battle.delivered_at,
        kind: 'battle_spoils',
        title: `Spoils claimed — ${battle.battle_name}`,
      })
    }

    if (battle.status === RAID_BATTLE_STATUS.RETREATED) {
      pushEvent(events, {
        id: `battle-retreat-${battle.id}`,
        at: battle.retreated_at || battle.updated_at,
        kind: 'battle_retreat',
        title: `Retreat — ${battle.battle_name}`,
        body: battle.retreat_note || null,
        meta: battle.retreat_xp ? `+${battle.retreat_xp} XP` : null,
      })
    }
  }

  for (const spoil of spoils) {
    pushEvent(events, {
      id: `spoil-${spoil.id}`,
      at: spoil.recorded_at || spoil.created_at,
      kind: 'spoil_claimed',
      title: spoil.ritual_name || 'Spoil claimed',
      meta: spoil.amount != null ? `₦${Number(spoil.amount).toLocaleString('en-NG')}` : null,
    })
  }

  for (const accrual of accruals) {
    if (!accrual.claimed_at) continue
    pushEvent(events, {
      id: `tribute-${accrual.id}`,
      at: accrual.claimed_at,
      kind: 'tribute_claimed',
      title: 'Tribute claimed',
      meta: accrual.amount != null ? `₦${Number(accrual.amount).toLocaleString('en-NG')}` : null,
    })
  }

  return events.sort((a, b) => ts(b.at) - ts(a.at))
}
