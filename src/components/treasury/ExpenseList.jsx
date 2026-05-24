import { useState } from 'react'
import { CollapsibleRow } from '@/components/ui/CollapsibleRow'
import { formatCurrency, formatDate } from '@/utils/format'
import { formatMoneyNgn } from '@/utils/formatMoney'

export function ExpenseList({ expenses = [] }) {
  const [expandedId, setExpandedId] = useState(null)

  if (!expenses.length) return null

  return (
    <div className="space-y-2">
      {expenses.map((entry) => (
        <CollapsibleRow
          key={entry.id}
          expanded={expandedId === entry.id}
          onToggle={() => setExpandedId((id) => (id === entry.id ? null : entry.id))}
          title={entry.category}
          trailing={formatMoneyNgn(entry.amount)}
          titleClassName="font-sans text-xs text-zinc-200"
        >
          <p className="text-[11px] text-zinc-500">{formatDate(entry.date)}</p>
          {entry.description ? <p className="text-[11px] text-zinc-400">{entry.description}</p> : null}
        </CollapsibleRow>
      ))}
    </div>
  )
}
