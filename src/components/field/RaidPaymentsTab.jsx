import { RaidCollectionPanel } from '@/components/field/RaidCollectionPanel'
import { useRaidCollection } from '@/hooks/useRaidCollection'

export function RaidPaymentsTab({ clientId, raidName }) {
  const collectionHook = useRaidCollection(clientId)

  return <RaidCollectionPanel raidName={raidName} collectionHook={collectionHook} />
}
