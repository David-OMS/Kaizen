import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useXpLog } from '@/hooks/useXpLog'

export function XpLogList() {
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const xpLogQuery = useXpLog(eventTypeFilter || null)

  const options = useMemo(() => {
    const entries = xpLogQuery.data ?? []
    return [...new Set(entries.map((entry) => entry.event_type))]
  }, [xpLogQuery.data])

  if (xpLogQuery.isLoading) {
    return (
      <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
        <CardContent className="px-4 text-sm text-zinc-300">Loading XP log...</CardContent>
      </Card>
    )
  }

  if (xpLogQuery.isError) {
    return (
      <Card className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8 py-4">
        <CardContent className="px-4 text-sm text-red-100">{xpLogQuery.error.message}</CardContent>
      </Card>
    )
  }

  const entries = xpLogQuery.data

  return (
    <section className="space-y-3">
      <div className="flex gap-2">
        <select
          value={eventTypeFilter}
          onChange={(event) => setEventTypeFilter(event.target.value)}
          className="h-9 flex-1 rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
        >
          <option value="" className="bg-[#12161D]">
            All event types
          </option>
          {options.map((eventType) => (
            <option key={eventType} value={eventType} className="bg-[#12161D]">
              {eventType}
            </option>
          ))}
        </select>
        <Button type="button" className="system-button text-[10px]" onClick={() => setEventTypeFilter('')}>
          Reset
        </Button>
      </div>

      {!entries.length ? (
        <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
          <CardContent className="px-4 text-sm text-zinc-300">No XP events yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
              <CardHeader className="px-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-sm tracking-[0.12em] text-[#7DD3FC] uppercase italic">
                    {entry.event_type}
                  </CardTitle>
                  <span className="rounded-sm border border-[#1E2530] px-2 py-1 font-mono text-[10px] text-zinc-200">
                    {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 px-4 text-sm text-zinc-300">
                <p>{entry.description}</p>
                <p>{new Date(entry.created_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}