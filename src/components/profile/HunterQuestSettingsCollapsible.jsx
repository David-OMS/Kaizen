import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuestBandwidthPicker } from '@/components/profile/QuestBandwidthPicker'
import { HunterVisionForm } from '@/components/profile/HunterVisionForm'
import { QUEST_BANDWIDTH } from '@/constants/questBudget'

const BANDWIDTH_LABEL = {
  [QUEST_BANDWIDTH.LIGHT]: 'Light',
  [QUEST_BANDWIDTH.NORMAL]: 'Normal',
  [QUEST_BANDWIDTH.PUSH]: 'Push',
}

export function HunterQuestSettingsCollapsible({ profile }) {
  const [open, setOpen] = useState(false)
  const bw = profile.quest_bandwidth || QUEST_BANDWIDTH.NORMAL
  const summary = BANDWIDTH_LABEL[bw] || 'Normal'

  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-2">
      <Button
        type="button"
        variant="ghost"
        className="flex h-auto w-full items-center justify-between rounded-none px-4 py-3 text-left hover:bg-transparent"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <p className="text-[10px] tracking-[0.14em] text-[#7DD3FC] uppercase">Daily setup</p>
          <p className="mt-0.5 text-sm text-zinc-300">
            Capacity: <span className="text-white">{summary}</span>
          </p>
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </Button>
      {open ? (
        <CardContent className="space-y-3 border-t border-[#1E2530] px-4 pt-3 pb-4">
          <QuestBandwidthPicker value={bw} />
          <HunterVisionForm
            initialVision={profile.hunter_vision || ''}
            initialGoals={profile.hunter_goals || ''}
          />
        </CardContent>
      ) : null}
    </Card>
  )
}
