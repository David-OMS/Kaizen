import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getLagosCalendarParts } from '@/utils/raidRecurringLagos'

export function RecurringStreamForm({ clientId, streamMutation, onClose }) {
  const lagos = getLagosCalendarParts()
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [fy, setFy] = useState(String(lagos.year))
  const [fm, setFm] = useState(String(lagos.month))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const n = Number(amount)
    if (!Number.isFinite(n) || n < 0) return
    const y = Number(fy)
    const m = Number(fm)
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return
    await streamMutation.mutateAsync({
      clientId,
      amount: n,
      purposeUserText: purpose,
      firstPeriodYear: y,
      firstPeriodMonth: m,
    })
    setAmount('')
    setPurpose('')
    onClose?.()
  }

  return (
    <form className="space-y-2 border border-[#1E2530] bg-[#12161D]/60 p-3" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#7DD3FC]">Recurring stream</p>
        <Button type="button" variant="ghost" className="h-auto px-1 text-[10px] text-zinc-500" onClick={onClose}>
          Cancel
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-zinc-400">Amount / period</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 rounded-[2px] border-[#1E2530]"
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-zinc-400">First month (Y)</Label>
          <Input
            type="number"
            min={2000}
            max={2100}
            value={fy}
            onChange={(e) => setFy(e.target.value)}
            className="h-9 rounded-[2px] border-[#1E2530]"
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-zinc-400">First month (1–12)</Label>
        <Input
          type="number"
          min={1}
          max={12}
          value={fm}
          onChange={(e) => setFm(e.target.value)}
          className="h-9 rounded-[2px] border-[#1E2530]"
          required
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-zinc-400">What it pays for</Label>
        <textarea
          rows={2}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-1 text-sm"
          required
        />
      </div>
      <Button type="submit" className="system-button w-full text-[10px]" disabled={streamMutation.isPending}>
        {streamMutation.isPending ? 'Naming…' : 'Open stream'}
      </Button>
    </form>
  )
}
