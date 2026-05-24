import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CollapsibleRow } from '@/components/ui/CollapsibleRow'
import { groupReceivedByMonth } from '@/utils/treasuryLedger'
import { formatCurrency, formatDate } from '@/utils/format'
import { formatMoneyNgn } from '@/utils/formatMoney'

export function TreasuryReceivedList({ received }) {
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState(null)

  const groups = groupReceivedByMonth(received)
  if (!groups.length) return null

  return (
    <div className="space-y-3">
      {groups.map(([monthKey, rows]) => {
        const monthTotal = rows.reduce((s, r) => s + r.amount, 0)
        return (
          <div key={monthKey} className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
              {monthKey} · {formatMoneyNgn(monthTotal)}
            </p>
            {rows.map((row) => (
              <CollapsibleRow
                key={row.id}
                expanded={expandedId === row.id}
                onToggle={() => setExpandedId((id) => (id === row.id ? null : row.id))}
                title={row.label}
                trailing={formatMoneyNgn(row.amount)}
              >
                <p className="text-[11px] text-zinc-400">{row.clientName}</p>
                <p className="text-[11px] text-zinc-500">
                  {row.sourceType === 'tribute' ? `Tribute · ${row.period}` : 'Battle spoil'} ·{' '}
                  {formatDate(row.receivedAt)}
                </p>
                {row.raidId ? (
                  <button
                    type="button"
                    className="text-[10px] uppercase tracking-[0.1em] text-[#7DD3FC]"
                    onClick={() => navigate(`/field/raid/${row.raidId}`)}
                  >
                    Open raid
                  </button>
                ) : null}
              </CollapsibleRow>
            ))}
          </div>
        )
      })}
    </div>
  )
}
