import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ModalPanel } from '@/components/ui/ModalPanel'

export function RetreatBattleModal({ battle, open, onClose, retreat }) {
  const [retreatNote, setRetreatNote] = useState('')
  const [clientDirective, setClientDirective] = useState('')

  if (!battle) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!retreatNote.trim()) return
    await retreat.mutateAsync({
      battleId: battle.id,
      retreatNote: retreatNote.trim(),
      clientDirective: clientDirective.trim(),
    })
    setRetreatNote('')
    setClientDirective('')
    onClose?.()
  }

  const handleClose = () => {
    setRetreatNote('')
    setClientDirective('')
    onClose?.()
  }

  return (
    <ModalPanel open={open} title={`Retreat — ${battle.battle_name}`} onClose={handleClose}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <p className="text-sm text-zinc-400">
          Record why this battle failed or was abandoned. The System may award experience XP for effort and learning.
        </p>
        <div className="space-y-1">
          <label htmlFor="retreat-note" className="text-[10px] uppercase tracking-[0.1em] text-[#7DD3FC]">
            Debrief (required)
          </label>
          <textarea
            id="retreat-note"
            rows={4}
            required
            value={retreatNote}
            onChange={(e) => setRetreatNote(e.target.value)}
            className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="client-directive" className="text-[10px] uppercase tracking-[0.1em] text-zinc-400">
            Client directive (optional)
          </label>
          <textarea
            id="client-directive"
            rows={2}
            value={clientDirective}
            onChange={(e) => setClientDirective(e.target.value)}
            className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-1 text-sm"
            placeholder='e.g. "Skip OCR, move to PWA"'
          />
        </div>
        <Button
          type="submit"
          className="system-button w-full text-[10px]"
          disabled={retreat.isPending || !retreatNote.trim()}
        >
          {retreat.isPending ? 'System processing…' : 'Confirm retreat'}
        </Button>
      </form>
    </ModalPanel>
  )
}
