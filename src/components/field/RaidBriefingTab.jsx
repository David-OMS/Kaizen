import { RaidBriefingSection } from '@/components/field/RaidBriefingSection'
import { BeginRaidButton } from '@/components/field/BeginRaidButton'
import { CompleteRaidButton } from '@/components/field/CompleteRaidButton'

export function RaidBriefingTab({ client, onEditRaid }) {
  return (
    <div className="space-y-4">
      <RaidBriefingSection client={client} onEditRaid={onEditRaid} />
      <BeginRaidButton client={client} />
      <CompleteRaidButton client={client} />
    </div>
  )
}
