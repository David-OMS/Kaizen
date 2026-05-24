import { useMemo, useState } from 'react'
import { StartBattleForm } from '@/components/field/StartBattleForm'
import { RaidBattleCard } from '@/components/field/RaidBattleCard'
import { Button } from '@/components/ui/button'
import { indexSpoilsByBattleId } from '@/utils/getBattleXpLabel'

export function RaidBattleList({ clientId, battles, spoils, startBattle, markDelivered, retreat, claimSpoil }) {
  const [showStartForm, setShowStartForm] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const spoilsByBattle = useMemo(() => indexSpoilsByBattleId(spoils), [spoils])

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          type="button"
          className="system-button text-[10px]"
          onClick={() => setShowStartForm((v) => !v)}
        >
          {showStartForm ? 'Close' : 'Start battle'}
        </Button>
      </div>

      {showStartForm ? (
        <StartBattleForm
          clientId={clientId}
          startBattle={startBattle}
          onClose={() => setShowStartForm(false)}
        />
      ) : null}

      <div className="space-y-2">
        {battles.length ? (
          battles.map((battle) => (
            <RaidBattleCard
              key={battle.id}
              battle={battle}
              spoil={spoilsByBattle[battle.id]}
              expanded={expandedId === battle.id}
              onToggle={() => setExpandedId((id) => (id === battle.id ? null : battle.id))}
              markDelivered={markDelivered}
              retreat={retreat}
              claimSpoil={claimSpoil}
            />
          ))
        ) : null}
      </div>
    </div>
  )
}
