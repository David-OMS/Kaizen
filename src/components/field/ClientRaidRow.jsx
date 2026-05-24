import { Button } from '@/components/ui/button'
import { CollapsibleRow } from '@/components/ui/CollapsibleRow'
import { formatCurrency, formatDate } from '@/utils/format'

export function ClientRaidRow({ client, expanded, onToggle, onOpenRaid }) {
  return (
    <CollapsibleRow
      expanded={expanded}
      onToggle={onToggle}
      title={client.name}
      trailing={`[${client.raid_rank}] · ${client.raid_status}`}
    >
      <p className="text-[11px] text-zinc-400">{client.project_name || 'No project set'}</p>
      {client.contract_value ? (
        <p className="text-[11px] text-zinc-500">Value {formatCurrency(client.contract_value)}</p>
      ) : null}
      <p className="text-[11px] text-zinc-500">Started {formatDate(client.start_date)}</p>
      <Button type="button" className="system-button w-full text-[10px]" onClick={() => onOpenRaid(client)}>
        Open raid
      </Button>
    </CollapsibleRow>
  )
}
