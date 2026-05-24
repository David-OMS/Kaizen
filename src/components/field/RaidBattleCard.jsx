import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CollapsibleRow } from '@/components/ui/CollapsibleRow'
import { RAID_BATTLE_STATUS, RAID_BATTLE_STATUS_LABELS } from '@/constants/raidBattleStatuses'
import { ClaimBattleSpoilForm } from '@/components/field/ClaimBattleSpoilForm'
import { RetreatBattleModal } from '@/components/field/RetreatBattleModal'
import { formatDate } from '@/utils/format'
import { getBattleXpLabel } from '@/utils/getBattleXpLabel'

export function RaidBattleCard({
  battle,
  spoil,
  expanded,
  onToggle,
  markDelivered,
  retreat,
  claimSpoil,
}) {
  const [showClaim, setShowClaim] = useState(false)
  const [showRetreat, setShowRetreat] = useState(false)

  const open =
    battle.status === RAID_BATTLE_STATUS.IN_PROGRESS ||
    battle.status === RAID_BATTLE_STATUS.AWAITING_SPOIL
  const xpLabel = getBattleXpLabel(battle, spoil)

  return (
    <CollapsibleRow expanded={expanded} onToggle={onToggle} title={battle.battle_name} trailing={xpLabel}>
      <div className="space-y-2 text-[11px] text-zinc-300">
          <p className="text-[10px] uppercase text-zinc-500">
            {RAID_BATTLE_STATUS_LABELS[battle.status] || battle.status}
            {' · '}
            Started {formatDate(battle.started_at)}
          </p>
          {battle.scope_note ? <p className="whitespace-pre-wrap text-zinc-400">{battle.scope_note}</p> : null}
          {battle.status === RAID_BATTLE_STATUS.RETREATED && battle.retreat_note ? (
            <p className="whitespace-pre-wrap text-zinc-400">{battle.retreat_note}</p>
          ) : null}
          {spoil?.ritual_name ? (
            <div className="rounded-sm border border-[#7DD3FC]/20 bg-[#7DD3FC]/5 px-2 py-2">
              <p className="text-[10px] uppercase text-zinc-500">Spoil claimed</p>
              <p className="font-mono text-[#7DD3FC]">{spoil.ritual_name}</p>
              <p className="text-[11px] text-zinc-400">{spoil.ritual_tagline}</p>
            </div>
          ) : null}

          {open ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {battle.status === RAID_BATTLE_STATUS.IN_PROGRESS ? (
                <Button
                  type="button"
                  className="system-button text-[10px]"
                  disabled={markDelivered.isPending}
                  onClick={() => markDelivered.mutate(battle.id)}
                >
                  Mark delivered
                </Button>
              ) : null}
              <Button type="button" className="system-button text-[10px]" onClick={() => setShowClaim((v) => !v)}>
                Claim spoil
              </Button>
              <Button type="button" className="system-button text-[10px]" onClick={() => setShowRetreat(true)}>
                Retreat
              </Button>
            </div>
          ) : null}

          {showClaim && open ? (
            <ClaimBattleSpoilForm
              battle={battle}
              claimSpoil={{
                ...claimSpoil,
                mutateAsync: async (payload) => {
                  await claimSpoil.mutateAsync(payload)
                  setShowClaim(false)
                },
              }}
            />
          ) : null}

      <RetreatBattleModal
        battle={battle}
        open={showRetreat}
        onClose={() => setShowRetreat(false)}
        retreat={retreat}
      />
      </div>
    </CollapsibleRow>
  )
}
