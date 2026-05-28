import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TREASURY_COLLECTION_MONTH_OPTIONS } from '@/constants/treasuryCollectionMonths'

const currentYear = new Date().getFullYear()

export function RaidCollectionPeriodCreateForm({ raidName, createPeriod }) {
  const [title, setTitle] = useState(raidName ? `${raidName} exam` : 'Exam period')
  const [startMonth, setStartMonth] = useState('3')
  const [startYear, setStartYear] = useState(String(currentYear))
  const [endMonth, setEndMonth] = useState('')
  const [endYear, setEndYear] = useState('')
  const [hasEndRange, setHasEndRange] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const sm = Number(startMonth)
    const sy = Number(startYear)
    if (!Number.isFinite(sm) || !Number.isFinite(sy)) return

    let em = null
    let ey = null
    if (hasEndRange && endMonth && endYear) {
      em = Number(endMonth)
      ey = Number(endYear)
      if (!Number.isFinite(em) || !Number.isFinite(ey)) return
    }

    await createPeriod.mutateAsync({
      title,
      startMonth: sm,
      startYear: sy,
      endMonth: em,
      endYear: ey,
    })
  }

  return (
    <form className="space-y-3 border border-[#1E2530] bg-[#12161D]/60 p-3" onSubmit={handleSubmit}>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#7DD3FC]">Open exam period</p>
      <p className="text-[11px] text-zinc-400">
        Track total received for this raid. Add amounts anytime — no schools, no payment dates.
      </p>

      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-zinc-400">Label</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-9 rounded-[2px] border-[#1E2530]"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-zinc-400">From month</Label>
          <select
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="h-9 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
            required
          >
            {TREASURY_COLLECTION_MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value} className="bg-[#12161D]">
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-zinc-400">From year</Label>
          <Input
            type="number"
            min={2000}
            max={2100}
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            className="h-9 rounded-[2px] border-[#1E2530]"
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[11px] text-zinc-400">
        <input
          type="checkbox"
          checked={hasEndRange}
          onChange={(e) => setHasEndRange(e.target.checked)}
          className="rounded border-[#1E2530]"
        />
        Set end month now (optional — leave open while exams run)
      </label>

      {hasEndRange ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-zinc-400">To month</Label>
            <select
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              className="h-9 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
            >
              <option value="" className="bg-[#12161D]">
                —
              </option>
              {TREASURY_COLLECTION_MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value} className="bg-[#12161D]">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-zinc-400">To year</Label>
            <Input
              type="number"
              min={2000}
              max={2100}
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
              className="h-9 rounded-[2px] border-[#1E2530]"
            />
          </div>
        </div>
      ) : null}

      {createPeriod.error ? (
        <p className="text-[11px] text-red-300">{createPeriod.error.message}</p>
      ) : null}

      <Button type="submit" className="system-button w-full text-[10px]" disabled={createPeriod.isPending}>
        {createPeriod.isPending ? 'Opening…' : 'Open period'}
      </Button>
    </form>
  )
}
