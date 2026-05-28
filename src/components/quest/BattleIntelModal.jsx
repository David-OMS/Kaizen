import { useState } from 'react'
import { ModalPanel } from '@/components/ui/ModalPanel'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function BattleIntelModal({ quest, open, onClose, onSubmit, isPending, error }) {
  const [intel, setIntel] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSubmit(intel)
    setIntel('')
  }

  return (
    <ModalPanel open={open} title="Battle Intel" onClose={onClose}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <p className="text-sm text-zinc-300">{quest?.title}</p>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-[#7DD3FC]">What you learned</Label>
          <textarea
            rows={4}
            required
            value={intel}
            onChange={(e) => setIntel(e.target.value)}
            placeholder="e.g. French action verbs, greetings, past tense…"
            className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
          />
        </div>
        {error ? <p className="text-[11px] text-red-300">{error}</p> : null}
        <Button type="submit" className="system-button w-full text-[10px]" disabled={isPending}>
          {isPending ? 'Locking…' : 'Lock intel & quiz'}
        </Button>
      </form>
    </ModalPanel>
  )
}
