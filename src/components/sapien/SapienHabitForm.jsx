import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SAPIEN_DEFAULT_XP_PER_CLAIM, SAPIEN_HABIT_KIND, WEEKDAY_LABELS } from '@/constants/sapienRanks'
import { useSapienMutations } from '@/hooks/useSapienHabits'
import { cn } from '@/lib/utils'

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

export function SapienHabitForm({ onSaved }) {
  const { create } = useSapienMutations()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [xpPerClaim, setXpPerClaim] = useState(String(SAPIEN_DEFAULT_XP_PER_CLAIM))
  const [habitKind, setHabitKind] = useState(SAPIEN_HABIT_KIND.ONCE)
  const [targetCount, setTargetCount] = useState('5')
  const [days, setDays] = useState(ALL_DAYS)

  const toggleDay = (d) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)))
  }

  const submit = async (e) => {
    e.preventDefault()
    await create.mutateAsync({
      title: title.trim(),
      xpPerClaim: Number(xpPerClaim) || SAPIEN_DEFAULT_XP_PER_CLAIM,
      habitKind,
      targetCount: habitKind === SAPIEN_HABIT_KIND.COUNT ? Number(targetCount) || 1 : 1,
      scheduleDays: days.length ? days : ALL_DAYS,
    })
    setTitle('')
    setOpen(false)
    onSaved?.()
  }

  if (!open) {
    return (
      <Button type="button" className="system-button w-full text-[10px]" onClick={() => setOpen(true)}>
        ADD HABIT
      </Button>
    )
  }

  return (
    <form className="space-y-3 rounded-sm border border-[#1E2530] bg-[#12161D]/90 p-4" onSubmit={submit}>
      {create.error ? (
        <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
          <AlertTitle>Failed</AlertTitle>
          <AlertDescription>{create.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-[#A855F7]">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="border-[#1E2530]" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-zinc-400">XP per claim</Label>
          <Input
            type="number"
            min={1}
            value={xpPerClaim}
            onChange={(e) => setXpPerClaim(e.target.value)}
            className="border-[#1E2530]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-zinc-400">Type</Label>
          <select
            value={habitKind}
            onChange={(e) => setHabitKind(e.target.value)}
            className="h-10 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
          >
            <option value={SAPIEN_HABIT_KIND.ONCE}>Once daily</option>
            <option value={SAPIEN_HABIT_KIND.COUNT}>Count (e.g. water)</option>
          </select>
        </div>
      </div>

      {habitKind === SAPIEN_HABIT_KIND.COUNT ? (
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-zinc-400">Target count</Label>
          <Input
            type="number"
            min={1}
            value={targetCount}
            onChange={(e) => setTargetCount(e.target.value)}
            className="border-[#1E2530]"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-wider text-zinc-400">Days</Label>
        <div className="flex flex-wrap gap-1">
          {WEEKDAY_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              className={cn(
                'rounded-[2px] border px-2 py-1 text-[10px] uppercase',
                days.includes(i) ? 'border-[#A855F7] text-[#A855F7]' : 'border-[#1E2530] text-zinc-500',
              )}
              onClick={() => toggleDay(i)}
            >
              {label}
            </button>
          ))}
        </div>
        <Button type="button" variant="ghost" className="h-auto p-0 text-[10px] text-zinc-500" onClick={() => setDays(ALL_DAYS)}>
          All days
        </Button>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="system-button flex-1 text-[10px]" disabled={create.isPending}>
          {create.isPending ? 'SAVING…' : 'SAVE'}
        </Button>
        <Button type="button" className="system-button text-[10px]" onClick={() => setOpen(false)}>
          CANCEL
        </Button>
      </div>
    </form>
  )
}
