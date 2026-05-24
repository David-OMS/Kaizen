import { Button } from '@/components/ui/button'
import { CollapsibleRow } from '@/components/ui/CollapsibleRow'
import { getHuntOutcomeLabel, isHuntPending, isHuntSuccessful } from '@/constants/huntOutcomes'
import { formatDate } from '@/utils/format'

export function HuntRow({ hunt, expanded, onToggle, convertedHuntIds, onConvertHunt, onResolveOutcome }) {
  const pending = isHuntPending(hunt.response_status)
  const successful = isHuntSuccessful(hunt.response_status)
  const converted = convertedHuntIds.has(hunt.id)
  const trailing = converted ? 'Raid' : getHuntOutcomeLabel(hunt.response_status)

  return (
    <CollapsibleRow expanded={expanded} onToggle={onToggle} title={hunt.contact_name} trailing={trailing}>
      <p className="text-[11px] text-zinc-400">{hunt.company || 'No company'}</p>
      <p className="text-[11px] text-zinc-500">
        {formatDate(hunt.date_sent)} · {hunt.channel || 'channel'} · Fear {hunt.fear_level ?? 3}
      </p>
      {hunt.notes ? <p className="text-[11px] text-zinc-400">Pitch: {hunt.notes}</p> : null}
      {hunt.outcome_notes ? <p className="text-[11px] text-zinc-400">Outcome: {hunt.outcome_notes}</p> : null}

      {pending ? (
        <Button type="button" className="system-button w-full text-[10px]" onClick={() => onResolveOutcome?.(hunt)}>
          Resolve outcome
        </Button>
      ) : null}

      {!pending && !converted ? (
        <Button
          type="button"
          className="system-button w-full text-[10px]"
          disabled={!successful}
          onClick={() => onConvertHunt?.(hunt)}
        >
          Convert to raid
        </Button>
      ) : null}

      {converted ? <p className="text-[10px] uppercase tracking-[0.1em] text-[#7DD3FC]">Converted to raid</p> : null}
    </CollapsibleRow>
  )
}
