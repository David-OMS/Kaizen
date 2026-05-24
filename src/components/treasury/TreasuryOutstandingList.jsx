import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CollapsibleRow } from '@/components/ui/CollapsibleRow'
import { formatCurrency, formatDate } from '@/utils/format'
import { formatMoneyNgn } from '@/utils/formatMoney'

function trailingFor(entry) {
  if (entry.sourceType === 'tribute_ready') return formatMoneyNgn(entry.amount)
  return 'Claim spoil'
}

export function TreasuryOutstandingList({ outstanding }) {
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState(null)

  if (!outstanding.length) return null

  return (
    <div className="space-y-2">
      {outstanding.map((entry) => (
        <CollapsibleRow
          key={entry.id}
          expanded={expandedId === entry.id}
          onToggle={() => setExpandedId((id) => (id === entry.id ? null : entry.id))}
          title={entry.label}
          trailing={trailingFor(entry)}
          titleClassName="font-sans text-xs text-zinc-200"
        >
          <p className="text-[11px] text-zinc-400">{entry.clientName}</p>
          <p className="text-[11px] text-zinc-500">
            {entry.sourceType === 'tribute_ready'
              ? `Period ${entry.period} · ready ${formatDate(entry.dueAt)}`
              : `Delivered · spoil not claimed ${entry.dueAt ? formatDate(entry.dueAt) : ''}`}
          </p>
          {entry.raidId ? (
            <button
              type="button"
              className="text-[10px] uppercase tracking-[0.1em] text-[#7DD3FC]"
              onClick={() => navigate(`/field/raid/${entry.raidId}`)}
            >
              Open raid
            </button>
          ) : null}
        </CollapsibleRow>
      ))}
    </div>
  )
}
