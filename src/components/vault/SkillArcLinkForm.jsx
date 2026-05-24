import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ARC_DAILY_SUPPORT_MAX } from '@/constants/skillArcMetadata'
import { useAttachSkillArcQuests } from '@/hooks/useSkillArcMutations'

export function SkillArcLinkForm({ arcId, weeklyQuests, dailyQuests }) {
  const attach = useAttachSkillArcQuests()
  const [weeklyId, setWeeklyId] = useState('')
  const [dailyIds, setDailyIds] = useState([])

  const toggleDaily = (id) => {
    setDailyIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= ARC_DAILY_SUPPORT_MAX) return prev
      return [...prev, id]
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await attach.mutateAsync({ arcId, weeklyQuestId: weeklyId, dailyQuestIds: dailyIds })
  }

  return (
    <form className="space-y-2 border-t border-[#1E2530] pt-2" onSubmit={handleSubmit}>
      <p className="text-[10px] text-zinc-500">Link 1 weekly anchor + 3–5 active daily quests.</p>
      <div className="space-y-1">
        <Label className="text-[10px] text-zinc-400">Weekly anchor</Label>
        <select
          value={weeklyId}
          onChange={(e) => setWeeklyId(e.target.value)}
          className="h-9 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-xs"
        >
          <option value="">Select…</option>
          {weeklyQuests.map((q) => (
            <option key={q.id} value={q.id} className="bg-[#12161D]">
              {q.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] text-zinc-400">Daily support</Label>
        <div className="max-h-28 space-y-1 overflow-y-auto text-xs">
          {dailyQuests.map((q) => (
            <label key={q.id} className="flex cursor-pointer items-center gap-2 text-zinc-300">
              <input
                type="checkbox"
                checked={dailyIds.includes(q.id)}
                onChange={() => toggleDaily(q.id)}
                className="accent-[#A855F7]"
              />
              {q.title}
            </label>
          ))}
        </div>
      </div>
      <Button type="submit" className="system-button w-full text-[10px]" disabled={attach.isPending}>
        {attach.isPending ? 'LINKING...' : 'Save links'}
      </Button>
      {attach.error ? <p className="text-[10px] text-red-300">{attach.error.message}</p> : null}
    </form>
  )
}
