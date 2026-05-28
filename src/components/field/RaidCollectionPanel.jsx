import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RaidCollectionEntryForm } from '@/components/field/RaidCollectionEntryForm'
import { RaidCollectionPeriodCreateForm } from '@/components/field/RaidCollectionPeriodCreateForm'
import { TREASURY_COLLECTION_MONTH_OPTIONS } from '@/constants/treasuryCollectionMonths'
import { formatCollectionPeriodRange } from '@/utils/treasuryCollectionPeriod'
import { formatCurrency } from '@/utils/format'

export function RaidCollectionPanel({ raidName, collectionHook }) {
  const { query, createPeriod, completePeriod, addEntry } = collectionHook
  const [showComplete, setShowComplete] = useState(false)
  const [endMonth, setEndMonth] = useState('')
  const [endYear, setEndYear] = useState(String(new Date().getFullYear()))

  if (query.isLoading) {
    return <Skeleton className="h-40 rounded-sm border border-[#1E2530] bg-[#12161D]" />
  }

  if (query.isError) {
    return <p className="text-sm text-red-200">{query.error.message}</p>
  }

  const { activePeriod, completedPeriods } = query.data

  const handleComplete = async () => {
    if (!activePeriod) return
    const payload = { periodId: activePeriod.id }
    if (endMonth) {
      payload.endMonth = Number(endMonth)
      payload.endYear = Number(endYear)
    }
    await completePeriod.mutateAsync(payload)
    setShowComplete(false)
  }

  return (
    <div className="space-y-4">
      {activePeriod ? (
        <Card className="rounded-sm border border-[#7DD3FC]/40 bg-[#12161D]/90 py-4">
          <CardHeader className="px-4 pb-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#7DD3FC]">Active exam period</p>
                <CardTitle className="text-base font-black uppercase italic text-white">
                  {activePeriod.title}
                </CardTitle>
                <p className="mt-1 text-[11px] text-zinc-400">
                  {formatCollectionPeriodRange(activePeriod)}
                </p>
              </div>
              <span className="rounded-sm border border-[#7DD3FC]/50 px-2 py-1 text-[10px] uppercase text-[#7DD3FC]">
                Open
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            <p className="font-mono text-2xl text-white">{formatCurrency(activePeriod.totalReceived)}</p>
            <p className="text-[11px] text-zinc-500">
              {activePeriod.entryCount} addition{activePeriod.entryCount === 1 ? '' : 's'} on this raid
            </p>

            <RaidCollectionEntryForm periodId={activePeriod.id} addEntry={addEntry} />

            {activePeriod.entries?.length ? (
              <ul className="max-h-48 space-y-1 overflow-y-auto border-t border-[#1E2530] pt-2">
                {activePeriod.entries.map((row) => (
                  <li key={row.id} className="flex justify-between gap-2 text-[11px] text-zinc-300">
                    <span className="truncate text-zinc-400">{row.note || 'Received'}</span>
                    <span className="shrink-0 font-mono text-[#7DD3FC]">{formatCurrency(row.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {showComplete ? (
              <div className="space-y-2 border border-[#1E2530] p-2">
                <p className="text-[10px] uppercase text-zinc-400">End month (optional)</p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                    className="h-9 rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
                  >
                    <option value="" className="bg-[#12161D]">
                      Skip
                    </option>
                    {TREASURY_COLLECTION_MONTH_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-[#12161D]">
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                    className="h-9 rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  className="system-button w-full text-[10px]"
                  disabled={completePeriod.isPending}
                  onClick={handleComplete}
                >
                  {completePeriod.isPending ? 'Closing…' : 'Confirm close period'}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full text-[10px] uppercase text-zinc-400"
                onClick={() => setShowComplete(true)}
              >
                Close this exam period
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <RaidCollectionPeriodCreateForm raidName={raidName} createPeriod={createPeriod} />
      )}

      {completedPeriods.length ? (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Closed periods</p>
          {completedPeriods.map((period) => (
            <Card key={period.id} className="rounded-sm border border-[#1E2530] bg-[#12161D]/60 py-3">
              <CardContent className="flex items-center justify-between gap-2 px-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{period.title}</p>
                  <p className="text-[10px] text-zinc-500">{formatCollectionPeriodRange(period)}</p>
                </div>
                <p className="font-mono text-sm text-[#7DD3FC]">{formatCurrency(period.totalReceived)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}
