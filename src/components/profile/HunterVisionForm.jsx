import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useUpdateProfileQuestSettings } from '@/hooks/useProfileQuestSettings'

export function HunterVisionForm({ initialVision = '', initialGoals = '' }) {
  const [vision, setVision] = useState(initialVision)
  const [goals, setGoals] = useState(initialGoals)
  const update = useUpdateProfileQuestSettings()

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault()
        update.mutate({ hunter_vision: vision, hunter_goals: goals })
      }}
    >
      <textarea
        rows={2}
        value={vision}
        onChange={(e) => setVision(e.target.value)}
        placeholder="Who you're becoming…"
        className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
      />
      <textarea
        rows={2}
        value={goals}
        onChange={(e) => setGoals(e.target.value)}
        placeholder="Current goals…"
        className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
      />
      <Button type="submit" className="system-button text-[10px]" disabled={update.isPending}>
        {update.isPending ? 'SAVING…' : 'Save'}
      </Button>
    </form>
  )
}
