import { useState } from 'react'
import { ClientRaidRow } from '@/components/field/ClientRaidRow'
import { Skeleton } from '@/components/ui/skeleton'
import { useClients } from '@/hooks/useClients'

export function ClientList({ statusFilter, onOpenRaid }) {
  const clientsQuery = useClients(statusFilter)
  const [expandedId, setExpandedId] = useState(null)

  if (clientsQuery.isLoading) {
    return <Skeleton className="h-40 rounded-sm border border-[#1E2530] bg-[#12161D]" />
  }

  if (clientsQuery.isError) {
    return <p className="text-sm text-red-200">{clientsQuery.error.message}</p>
  }

  const clients = clientsQuery.data
  if (!clients.length) {
    return null
  }

  return (
    <div className="space-y-2">
      {clients.map((client) => (
        <ClientRaidRow
          key={client.id}
          client={client}
          expanded={expandedId === client.id}
          onToggle={() => setExpandedId((id) => (id === client.id ? null : client.id))}
          onOpenRaid={onOpenRaid}
        />
      ))}
    </div>
  )
}
