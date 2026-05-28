import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function RaidCollectionEntryForm({ periodId, addEntry }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) return
    await addEntry.mutateAsync({ periodId, amount: n, note })
    setAmount('')
    setNote('')
  }

  return (
    <form className="space-y-2 border border-[#1E2530] bg-[#12161D]/60 p-3" onSubmit={handleSubmit}>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#7DD3FC]">Add received</p>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-zinc-400">Amount (₦)</Label>
        <Input
          type="number"
          min={1}
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-9 rounded-[2px] border-[#1E2530]"
          placeholder="e.g. 50000"
          required
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-zinc-400">Note (optional)</Label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-9 rounded-[2px] border-[#1E2530]"
          placeholder="Batch, tranche, etc."
        />
      </div>
      {addEntry.error ? <p className="text-[11px] text-red-300">{addEntry.error.message}</p> : null}
      <Button type="submit" className="system-button w-full text-[10px]" disabled={addEntry.isPending}>
        {addEntry.isPending ? 'Adding…' : 'Add to period total'}
      </Button>
    </form>
  )
}
