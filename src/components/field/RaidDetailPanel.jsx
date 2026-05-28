import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { RaidBattlesTab } from '@/components/field/RaidBattlesTab'
import { RaidBriefingTab } from '@/components/field/RaidBriefingTab'
import { RaidChronicleTab } from '@/components/field/RaidChronicleTab'
import { RaidDetailTabs } from '@/components/field/RaidDetailTabs'
import { RaidPaymentsTab } from '@/components/field/RaidPaymentsTab'
import { RaidTributeTab } from '@/components/field/RaidTributeTab'
import { RAID_DETAIL_TABS } from '@/constants/raidDetailTabs'
import { useRaidBattles } from '@/hooks/useRaidBattles'
import { useRaidDetail } from '@/hooks/useRaidDetail'
import { useRaidSpoilsPanel } from '@/hooks/useRaidSpoils'

export function RaidDetailPanel({ client, onEditRaid }) {
  const [activeTab, setActiveTab] = useState('payments')
  const detailQuery = useRaidDetail(client)
  const battlesHook = useRaidBattles(client?.id)
  const spoilsHook = useRaidSpoilsPanel(client?.id)

  if (!client?.id) return null

  if (detailQuery.isLoading) {
    return <Skeleton className="h-48 rounded-sm border border-[#1E2530] bg-[#12161D]" />
  }

  if (detailQuery.isError) {
    return (
      <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
        <AlertTitle>Could not load raid</AlertTitle>
        <AlertDescription>{detailQuery.error.message}</AlertDescription>
      </Alert>
    )
  }

  const { battles, spoils, streams, accrualsByStream, chronicle } = detailQuery.data

  return (
    <div className="space-y-4 text-sm">
      <RaidDetailTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={RAID_DETAIL_TABS} />

      {activeTab === 'briefing' ? (
        <RaidBriefingTab client={client} onEditRaid={onEditRaid} />
      ) : null}

      {activeTab === 'payments' ? (
        <RaidPaymentsTab clientId={client.id} raidName={client.name} />
      ) : null}

      {activeTab === 'battles' ? (
        <RaidBattlesTab clientId={client.id} battles={battles} spoils={spoils} battlesHook={battlesHook} />
      ) : null}

      {activeTab === 'tribute' ? (
        <RaidTributeTab
          clientId={client.id}
          streams={streams}
          accrualsByStream={accrualsByStream}
          spoilsHook={spoilsHook}
        />
      ) : null}

      {activeTab === 'chronicle' ? <RaidChronicleTab events={chronicle} /> : null}
    </div>
  )
}
