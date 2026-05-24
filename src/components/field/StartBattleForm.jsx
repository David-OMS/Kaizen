import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function StartBattleForm({ clientId, startBattle, onClose }) {
  const [battleName, setBattleName] = useState('')
  const [scopeNote, setScopeNote] = useState('')
  const [startedAt, setStartedAt] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!battleName.trim()) return
    await startBattle.mutateAsync({
      clientId,
      battleName,
      scopeNote,
      startedAt,
      dueDate: dueDate || null,
    })
    setBattleName('')
    setScopeNote('')
    setDueDate('')
    onClose?.()
  }

  return (
    <form className="space-y-2 border border-[#1E2530] bg-[#12161D]/60 p-3" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#7DD3FC]">New battle</p>
        <Button type="button" variant="ghost" className="h-auto px-1 text-[10px] text-zinc-500" onClick={onClose}>
          Cancel
        </Button>
      </div>
      <div className="space-y-1">
        <Label htmlFor="battle-name" className="text-[10px] uppercase text-zinc-400">
          Battle name
        </Label>
        <Input
          id="battle-name"
          value={battleName}
          onChange={(e) => setBattleName(e.target.value)}
          className="h-9 rounded-[2px] border-[#1E2530]"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-zinc-400">Start date</Label>
          <Input
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="h-9 rounded-[2px] border-[#1E2530]"
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-zinc-400">Due (optional)</Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-9 rounded-[2px] border-[#1E2530]"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase text-zinc-400">Scope</Label>
        <textarea
          rows={2}
          value={scopeNote}
          onChange={(e) => setScopeNote(e.target.value)}
          className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-1 text-sm"
          placeholder="What this battle covers…"
        />
      </div>
      <Button type="submit" className="system-button w-full text-[10px]" disabled={startBattle.isPending}>
        {startBattle.isPending ? 'STARTING…' : 'Start battle'}
      </Button>
    </form>
  )
}
