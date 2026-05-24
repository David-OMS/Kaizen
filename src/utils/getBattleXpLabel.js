import { RAID_BATTLE_STATUS } from '@/constants/raidBattleStatuses'
import { getSpoilXpForAmount } from '@/utils/moneyBandXp'

/** Compact XP line for battle list cards. */
export function getBattleXpLabel(battle, spoil) {
  if (battle.status === RAID_BATTLE_STATUS.RETREATED) {
    const xp = Number(battle.retreat_xp || 0)
    return xp > 0 ? `+${xp} XP` : '0 XP'
  }

  if (battle.status === RAID_BATTLE_STATUS.SPOILS_CLAIMED) {
    const xp = Number(spoil?.battle_xp ?? getSpoilXpForAmount(spoil?.amount) ?? 0)
    return xp > 0 ? `+${xp} XP` : '0 XP'
  }

  return '—'
}

export function indexSpoilsByBattleId(spoils) {
  const map = {}
  for (const spoil of spoils ?? []) {
    if (spoil.battle_id) map[spoil.battle_id] = spoil
  }
  return map
}
