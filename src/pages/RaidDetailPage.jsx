import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ClientForm } from '@/components/field/ClientForm'
import { RaidDetailPanel } from '@/components/field/RaidDetailPanel'
import { Button } from '@/components/ui/button'
import { ModalPanel } from '@/components/ui/ModalPanel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useClient } from '@/hooks/useClient'
import { formatCurrency, formatDate } from '@/utils/format'

export function RaidDetailPage() {
  const { raidId } = useParams()
  const navigate = useNavigate()
  const clientQuery = useClient(raidId)
  const [editingBriefing, setEditingBriefing] = useState(false)

  const client = clientQuery.data

  return (
    <section className="space-y-4 pb-8">
      <Button
        type="button"
        variant="ghost"
        className="h-auto px-0 text-[10px] tracking-[0.14em] text-zinc-400 uppercase hover:text-[#7DD3FC]"
        onClick={() => navigate('/field')}
      >
        ← Back to raids
      </Button>

      {clientQuery.isLoading ? (
        <Skeleton className="h-32 rounded-sm border border-[#1E2530] bg-[#12161D]" />
      ) : null}

      {clientQuery.isError ? (
        <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
          <AlertTitle>Could not load raid</AlertTitle>
          <AlertDescription>{clientQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {client ? (
        <>
          <header className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] tracking-[0.16em] text-[#A855F7] uppercase">Raid</p>
                <h2 className="text-lg font-black tracking-[0.1em] text-[#7DD3FC] uppercase italic">
                  {client.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-300">{client.project_name || 'No objective set'}</p>
              </div>
              <span className="rounded-sm border border-[#1E2530] px-2 py-1 text-[10px] text-zinc-200 uppercase">
                {client.raid_status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
              <span>
                Rank <span className="font-mono text-[#7DD3FC]">{client.raid_rank}</span>
              </span>
              {client.difficulty_score != null ? (
                <span>Scope {client.difficulty_score}/100</span>
              ) : null}
              <span>Started {formatDate(client.start_date)}</span>
              {client.contract_value ? <span>Value {formatCurrency(client.contract_value)}</span> : null}
            </div>
          </header>

          <RaidDetailPanel client={client} onEditRaid={() => setEditingBriefing(true)} />
        </>
      ) : null}

      <ModalPanel
        open={editingBriefing}
        title="Edit raid briefing"
        onClose={() => setEditingBriefing(false)}
      >
        {client ? (
          <ClientForm
            editingClient={client}
            onEditCancel={() => setEditingBriefing(false)}
            onSaved={() => setEditingBriefing(false)}
          />
        ) : null}
      </ModalPanel>
    </section>
  )
}
