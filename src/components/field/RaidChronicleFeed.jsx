import { useState } from 'react'
import { CollapsibleRow } from '@/components/ui/CollapsibleRow'
import { formatDate } from '@/utils/format'

const KIND_LABELS = {
  raid_created: 'Raid',
  battle_started: 'Battle',
  battle_delivered: 'Delivery',
  battle_spoils: 'Spoils',
  battle_retreat: 'Retreat',
  spoil_claimed: 'Spoil',
  tribute_claimed: 'Tribute',
}

export function RaidChronicleFeed({ events }) {
  const [expandedId, setExpandedId] = useState(null)

  if (!events?.length) {
    return null
  }

  return (
    <div className="space-y-2">
      {events.map((event) => {
        const hasDetail = Boolean(event.body || event.meta)
        const trailing = formatDate(event.at)
        const label = KIND_LABELS[event.kind] || event.kind

        if (!hasDetail) {
          return (
            <div
              key={event.id}
              className="flex items-center gap-2 rounded-sm border border-[#1E2530] bg-[#12161D]/40 px-3 py-2.5"
            >
              <span className="min-w-0 flex-1 truncate text-xs text-zinc-200">{event.title}</span>
              <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                {label} · {trailing}
              </span>
            </div>
          )
        }

        return (
          <CollapsibleRow
            key={event.id}
            expanded={expandedId === event.id}
            onToggle={() => setExpandedId((id) => (id === event.id ? null : event.id))}
            title={event.title}
            trailing={`${label} · ${trailing}`}
            titleClassName="font-sans text-xs text-zinc-200"
          >
            {event.body ? <p className="whitespace-pre-wrap text-[11px] text-zinc-400">{event.body}</p> : null}
            {event.meta ? <p className="font-mono text-[#7DD3FC]">{event.meta}</p> : null}
          </CollapsibleRow>
        )
      })}
    </div>
  )
}
