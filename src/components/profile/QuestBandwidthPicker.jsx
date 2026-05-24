import { Button } from '@/components/ui/button'
import { QUEST_BANDWIDTH } from '@/constants/questBudget'
import { useUpdateProfileQuestSettings } from '@/hooks/useProfileQuestSettings'

const OPTIONS = [
  { key: QUEST_BANDWIDTH.LIGHT, label: 'Light' },
  { key: QUEST_BANDWIDTH.NORMAL, label: 'Normal' },
  { key: QUEST_BANDWIDTH.PUSH, label: 'Push' },
]

export function QuestBandwidthPicker({ value }) {
  const update = useUpdateProfileQuestSettings()

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.key}
          type="button"
          className={`system-button text-[10px] ${value === opt.key ? 'border-[#7DD3FC]' : ''}`}
          disabled={update.isPending}
          onClick={() => update.mutate({ quest_bandwidth: opt.key })}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  )
}
