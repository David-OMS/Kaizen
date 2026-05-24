import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ModalPanel } from '@/components/ui/ModalPanel'
import { HUNT_FINAL_OUTCOME_OPTIONS, HUNT_OUTCOME } from '@/constants/huntOutcomes'
import { useFinalizeHuntOutcome } from '@/hooks/useReachoutMutations'

export function FinalizeHuntOutcomeModal({ hunt, open, onClose, onResolved }) {
  const finalize = useFinalizeHuntOutcome()
  const [outcome, setOutcome] = useState('')
  const [outcomeNotes, setOutcomeNotes] = useState('')

  if (!hunt) return null

  const needsNotes =
    outcome === HUNT_OUTCOME.SUCCESSFUL || outcome === HUNT_OUTCOME.REJECTED

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (needsNotes && !outcomeNotes.trim()) return

    const result = await finalize.mutateAsync({
      id: hunt.id,
      outcome,
      notes: hunt.notes,
      outcomeNotes: needsNotes ? outcomeNotes.trim() : null,
      previousStatus: hunt.response_status,
    })
    setOutcome('')
    setOutcomeNotes('')
    onResolved?.(result)
    onClose?.()
  }

  const handleClose = () => {
    setOutcome('')
    setOutcomeNotes('')
    onClose?.()
  }

  const selected = HUNT_FINAL_OUTCOME_OPTIONS.find((o) => o.value === outcome)

  return (
    <ModalPanel open={open} title="Resolve hunt outcome" onClose={handleClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-zinc-300">
          How did the hunt on <span className="text-[#7DD3FC]">{hunt.contact_name}</span> end?
        </p>

        {finalize.error ? (
          <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
            <AlertTitle>Could not lock outcome</AlertTitle>
            <AlertDescription>{finalize.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          {HUNT_FINAL_OUTCOME_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-sm border border-[#1E2530] p-3 has-[:checked]:border-[#7DD3FC]"
            >
              <input
                type="radio"
                name="hunt-outcome"
                value={option.value}
                checked={outcome === option.value}
                onChange={() => setOutcome(option.value)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-white">{option.label}</span>
                <span className="block text-xs text-zinc-500">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>

        {needsNotes ? (
          <div className="space-y-2">
            <label htmlFor="outcome-notes" className="text-[10px] uppercase tracking-[0.1em] text-[#7DD3FC]">
              What they said
            </label>
            <textarea
              id="outcome-notes"
              rows={3}
              required
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
              placeholder={
                outcome === HUNT_OUTCOME.SUCCESSFUL
                  ? 'Meeting booked, positive reply…'
                  : 'Their reason for saying no…'
              }
            />
          </div>
        ) : null}

        {selected ? (
          <p className="text-[11px] text-zinc-500">The System will grant outcome XP when you confirm.</p>
        ) : null}

        <Button
          type="submit"
          className="system-button w-full text-[10px]"
          disabled={!outcome || finalize.isPending || (needsNotes && !outcomeNotes.trim())}
        >
          {finalize.isPending ? 'LOCKING OUTCOME…' : 'CONFIRM OUTCOME'}
        </Button>
      </form>
    </ModalPanel>
  )
}
