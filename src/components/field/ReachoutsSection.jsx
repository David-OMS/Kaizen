import { useState } from 'react'
import { ConvertHuntToRaidForm } from '@/components/field/ConvertHuntToRaidForm'
import { FinalizeHuntOutcomeModal } from '@/components/field/FinalizeHuntOutcomeModal'
import { ReachoutList } from '@/components/field/ReachoutList'
import { ReachoutForm } from '@/components/field/ReachoutForm'
import { RejectionTrophyCard } from '@/components/field/RejectionTrophyCard'
import { Button } from '@/components/ui/button'
import { ModalPanel } from '@/components/ui/ModalPanel'
import {
  isHuntDeclined,
  isHuntGhosted,
  isHuntPending,
  isHuntSuccessful,
} from '@/constants/huntOutcomes'
import { useClients } from '@/hooks/useClients'
import { useReachouts } from '@/hooks/useReachouts'
import { getConvertedHuntIds } from '@/utils/field'

export function ReachoutsSection() {
  const [isHuntModalOpen, setIsHuntModalOpen] = useState(false)
  const [selectedHunt, setSelectedHunt] = useState(null)
  const [resolvingHunt, setResolvingHunt] = useState(null)
  const reachoutsQuery = useReachouts()
  const raidsQuery = useClients()

  const convertedHuntIds = getConvertedHuntIds(raidsQuery.data ?? [])
  const hunts = reachoutsQuery.data ?? []
  const pendingCount = hunts.filter((hunt) => isHuntPending(hunt.response_status)).length
  const successfulCount = hunts.filter((hunt) => isHuntSuccessful(hunt.response_status)).length
  const rejectedCount = hunts.filter((hunt) => isHuntDeclined(hunt.response_status)).length
  const rejectionCount = hunts.filter(
    (hunt) => isHuntDeclined(hunt.response_status) || isHuntGhosted(hunt.response_status),
  ).length

  const handleHuntSaved = () => {
    setIsHuntModalOpen(false)
  }

  const handleOutcomeResolved = () => {
    setResolvingHunt(null)
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-sm border border-[#1E2530] bg-[#12161D] p-2 text-center">
          <p className="text-[10px] text-zinc-400 uppercase">Total</p>
          <p className="font-mono text-lg text-white">{hunts.length}</p>
        </div>
        <div className="rounded-sm border border-[#1E2530] bg-[#12161D] p-2 text-center">
          <p className="text-[10px] text-zinc-400 uppercase">Pending</p>
          <p className="font-mono text-lg text-white">{pendingCount}</p>
        </div>
        <div className="rounded-sm border border-[#1E2530] bg-[#12161D] p-2 text-center">
          <p className="text-[10px] text-zinc-400 uppercase">Successful</p>
          <p className="font-mono text-lg text-white">{successfulCount}</p>
        </div>
        <div className="rounded-sm border border-[#1E2530] bg-[#12161D] p-2 text-center">
          <p className="text-[10px] text-zinc-400 uppercase">Rejected</p>
          <p className="font-mono text-lg text-white">{rejectedCount}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" className="system-button text-[10px]" onClick={() => setIsHuntModalOpen(true)}>
          Start New Hunt
        </Button>
      </div>

      <RejectionTrophyCard count={rejectionCount} />

      <ReachoutList
        convertedHuntIds={convertedHuntIds}
        onConvertHunt={setSelectedHunt}
        onResolveOutcome={setResolvingHunt}
      />

      <ModalPanel open={isHuntModalOpen} title="Start New Hunt" onClose={() => setIsHuntModalOpen(false)}>
        <ReachoutForm onSaved={handleHuntSaved} />
      </ModalPanel>

      <FinalizeHuntOutcomeModal
        hunt={resolvingHunt}
        open={Boolean(resolvingHunt)}
        onClose={() => setResolvingHunt(null)}
        onResolved={handleOutcomeResolved}
      />

      <ModalPanel
        open={Boolean(selectedHunt)}
        title="Convert Hunt to Raid"
        onClose={() => setSelectedHunt(null)}
        className="max-w-xl"
      >
        {selectedHunt ? <ConvertHuntToRaidForm hunt={selectedHunt} onSaved={() => setSelectedHunt(null)} /> : null}
      </ModalPanel>
    </section>
  )
}
