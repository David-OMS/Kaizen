import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function IncompleteQuestForm({ onSubmit, isPending, error }) {
  const [reason, setReason] = useState('')

  return (
    <form
      className="space-y-2 border-t border-[#1E2530] pt-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(reason)
      }}
    >
      <p className="text-[10px] tracking-wide text-zinc-400 uppercase">Incomplete — reason required</p>
      <textarea
        rows={2}
        required
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
        placeholder="Why not finished?"
      />
      {error ? <p className="text-[10px] text-red-300">{error}</p> : null}
      <Button type="submit" className="system-button w-full text-[10px]" disabled={isPending}>
        {isPending ? 'JUDGING...' : 'Submit for extension'}
      </Button>
    </form>
  )
}
