import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuestLog } from '@/hooks/useQuests'

export function QuestLogList() {
  const [periodFilter, setPeriodFilter] = useState(null)
  const logQuery = useQuestLog(periodFilter)

  if (logQuery.isLoading) {
    return (
      <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
        <CardContent className="px-4 text-sm text-zinc-300">Loading quest log...</CardContent>
      </Card>
    )
  }

  if (logQuery.isError) {
    return (
      <Card className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8 py-4">
        <CardContent className="px-4 text-sm text-red-100">{logQuery.error.message}</CardContent>
      </Card>
    )
  }

  const entries = logQuery.data

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          className={`system-button text-[10px] ${periodFilter === null ? 'system-button-active' : ''}`}
          onClick={() => setPeriodFilter(null)}
        >
          All
        </Button>
        <Button
          type="button"
          className={`system-button text-[10px] ${periodFilter === 'daily' ? 'system-button-active' : ''}`}
          onClick={() => setPeriodFilter('daily')}
        >
          Daily
        </Button>
        <Button
          type="button"
          className={`system-button text-[10px] ${periodFilter === 'weekly' ? 'system-button-active' : ''}`}
          onClick={() => setPeriodFilter('weekly')}
        >
          Weekly
        </Button>
      </div>

      {!entries.length ? (
        <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
          <CardContent className="px-4 text-sm text-zinc-300">No quest history yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
              <CardHeader className="px-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-sm tracking-[0.12em] text-[#7DD3FC] uppercase italic">
                    {entry.title}
                  </CardTitle>
                  <span className="rounded-sm border border-[#1E2530] px-2 py-1 text-[10px] text-zinc-200 uppercase">
                    {entry.outcome}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 px-4 text-sm text-zinc-300">
                <p>Period: {entry.period}</p>
                <p>XP Delta: {entry.xp_delta}</p>
                <p>Logged: {new Date(entry.logged_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}