import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSpoilXpForAmount } from '@/utils/moneyBandXp'

export function ClaimBattleSpoilForm({ battle, claimSpoil }) {
  const [amount, setAmount] = useState('')
  const [workNote, setWorkNote] = useState('')
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10))

  const previewXp = useMemo(() => {
    const n = Number(amount)
    if (!Number.isFinite(n) || n < 0) return 0
    return getSpoilXpForAmount(n)
  }, [amount])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const n = Number(amount)
    if (!Number.isFinite(n) || n < 0) return
    await claimSpoil.mutateAsync({
      battleId: battle.id,
      amount: n,
      workNote: workNote || battle.scope_note,
      recordedAt: paidDate,
    })
    setAmount('')
    setWorkNote('')
  }

  return (
    <form className="mt-2 space-y-2 border border-[#7DD3FC]/30 p-2" onSubmit={handleSubmit}>
      <p className="text-[10px] uppercase text-[#7DD3FC]">Claim spoil</p>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-zinc-400">Amount</Label>
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
        <Label className="text-[10px] uppercase text-zinc-400">Paid date</Label>
        <Input
          type="date"
          value={paidDate}
          onChange={(e) => setPaidDate(e.target.value)}
          className="h-9 rounded-[2px] border-[#1E2530]"
          required
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-zinc-400">Delivery note</Label>
        <textarea
          rows={2}
          value={workNote}
          onChange={(e) => setWorkNote(e.target.value)}
          className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-1 text-sm"
          placeholder={battle.scope_note || 'What this payment covers…'}
        />
      </div>
      {previewXp > 0 ? (
        <p className="text-[10px] text-zinc-500">
          Spoil XP: <span className="font-mono text-[#7DD3FC]">{previewXp}</span>
        </p>
      ) : null}
      {claimSpoil.error ? (
        <p className="text-[10px] text-red-300">{claimSpoil.error.message}</p>
      ) : null}
      <Button type="submit" className="system-button w-full text-[10px]" disabled={claimSpoil.isPending}>
        {claimSpoil.isPending ? 'Claiming…' : 'Claim spoil'}
      </Button>
    </form>
  )
}
