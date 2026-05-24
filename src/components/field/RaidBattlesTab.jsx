import { RaidBattleList } from '@/components/field/RaidBattleList'

export function RaidBattlesTab({ clientId, battles, spoils, battlesHook }) {
  return (
    <RaidBattleList
      clientId={clientId}
      battles={battles}
      spoils={spoils}
      startBattle={battlesHook.startBattle}
      markDelivered={battlesHook.markDelivered}
      retreat={battlesHook.retreat}
      claimSpoil={battlesHook.claimSpoil}
    />
  )
}
