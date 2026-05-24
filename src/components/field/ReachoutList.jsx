import { useState } from 'react'
import { HuntRow } from '@/components/field/HuntRow'
import { Skeleton } from '@/components/ui/skeleton'
import { useReachouts } from '@/hooks/useReachouts'

export function ReachoutList({ convertedHuntIds, onConvertHunt, onResolveOutcome }) {
  const reachoutsQuery = useReachouts()
  const [expandedId, setExpandedId] = useState(null)

  if (reachoutsQuery.isLoading) {
    return <Skeleton className="h-40 rounded-sm border border-[#1E2530] bg-[#12161D]" />
  }

  if (reachoutsQuery.isError) {
    return <p className="text-sm text-red-200">{reachoutsQuery.error.message}</p>
  }

  const reachouts = reachoutsQuery.data
  if (!reachouts.length) {
    return null
  }

  return (
    <div className="space-y-2">
      {reachouts.map((reachout) => (
        <HuntRow
          key={reachout.id}
          hunt={reachout}
          expanded={expandedId === reachout.id}
          onToggle={() => setExpandedId((id) => (id === reachout.id ? null : reachout.id))}
          convertedHuntIds={convertedHuntIds}
          onConvertHunt={onConvertHunt}
          onResolveOutcome={onResolveOutcome}
        />
      ))}
    </div>
  )
}
