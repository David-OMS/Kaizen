import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientForm } from '@/components/field/ClientForm.jsx'
import { ClientList } from '@/components/field/ClientList.jsx'
import { ClientStatusTabs } from '@/components/field/ClientStatusTabs.jsx'
import { Button } from '@/components/ui/button'
import { ModalPanel } from '@/components/ui/ModalPanel'
import { useClients } from '@/hooks/useClients'

export function ClientsSection() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('ongoing')
  const [editingClient, setEditingClient] = useState(null)
  const [isRaidModalOpen, setIsRaidModalOpen] = useState(false)
  const raidsQuery = useClients()

  const raids = raidsQuery.data ?? []
  const pendingCount = raids.filter((raid) => raid.raid_status === 'pending').length
  const ongoingCount = raids.filter((raid) => raid.raid_status === 'ongoing').length
  const completedCount = raids.filter((raid) => raid.raid_status === 'completed').length

  const closeRaidModal = () => {
    setEditingClient(null)
    setIsRaidModalOpen(false)
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-sm border border-[#1E2530] bg-[#12161D] p-2 text-center">
          <p className="text-[10px] text-zinc-400 uppercase">Pending</p>
          <p className="font-mono text-lg text-white">{pendingCount}</p>
        </div>
        <div className="rounded-sm border border-[#1E2530] bg-[#12161D] p-2 text-center">
          <p className="text-[10px] text-zinc-400 uppercase">Ongoing</p>
          <p className="font-mono text-lg text-white">{ongoingCount}</p>
        </div>
        <div className="rounded-sm border border-[#1E2530] bg-[#12161D] p-2 text-center">
          <p className="text-[10px] text-zinc-400 uppercase">Completed</p>
          <p className="font-mono text-lg text-white">{completedCount}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" className="system-button text-[10px]" onClick={() => setIsRaidModalOpen(true)}>
          Start New Raid
        </Button>
      </div>

      <ClientStatusTabs
        activeStatus={statusFilter}
        onStatusChange={(nextStatus) => {
          setStatusFilter(nextStatus)
          setEditingClient(null)
        }}
      />

      <ClientList
        statusFilter={statusFilter}
        onOpenRaid={(raid) => navigate(`/field/raid/${raid.id}`)}
      />

      <ModalPanel
        open={isRaidModalOpen || Boolean(editingClient)}
        title={editingClient ? 'Edit raid briefing' : 'Start New Raid'}
        onClose={closeRaidModal}
      >
        <ClientForm editingClient={editingClient} onEditCancel={closeRaidModal} onSaved={closeRaidModal} />
      </ModalPanel>
    </section>
  )
}
