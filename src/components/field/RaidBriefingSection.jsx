import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CollapsibleRow } from '@/components/ui/CollapsibleRow'
import { RaidAnalyzeButton } from '@/components/field/RaidAnalyzeButton'

export function RaidBriefingSection({ client, onEditRaid }) {
  const [expanded, setExpanded] = useState(false)
  const objective = client.project_name || 'No objective set'
  const trailing = `[${client.raid_rank}]${client.difficulty_score != null ? ` · ${client.difficulty_score}/100` : ''}`

  return (
    <CollapsibleRow
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      title={objective}
      trailing={trailing}
    >
      <div className="flex flex-wrap gap-2">
        <RaidAnalyzeButton client={client} />
        <Button type="button" className="system-button text-[10px]" onClick={onEditRaid}>
          Edit briefing
        </Button>
      </div>
      <p className="whitespace-pre-wrap text-[11px] text-zinc-400">
        {client.notes?.trim() || '—'}
      </p>
    </CollapsibleRow>
  )
}
