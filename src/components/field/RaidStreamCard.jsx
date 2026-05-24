import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CollapsibleRow } from '@/components/ui/CollapsibleRow'
import { isClaimable } from '@/utils/raidRecurringLagos'
import { formatMoneyNgn } from '@/utils/formatMoney'

function fmt(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '—'
  return x.toLocaleString('en-NG', { maximumFractionDigits: 2 })
}

function streamTrailing(stream, accruals) {
  const ready = (accruals ?? []).filter((a) => !a.claimed_at && isClaimable(a.ready_at)).length
  const base = formatMoneyNgn(stream.amount)
  return ready > 0 ? `${base} · ${ready} ready` : base
}

export function RaidStreamCard({ stream, accruals, claimAccrual, patchStreamAmount, expanded, onToggle }) {
  const [nextAmt, setNextAmt] = useState(String(stream.amount))

  const handlePatch = async () => {
    const n = Number(nextAmt)
    if (!Number.isFinite(n) || n < 0) return
    await patchStreamAmount.mutateAsync({ streamId: stream.id, amount: n })
  }

  return (
    <CollapsibleRow
      expanded={expanded}
      onToggle={onToggle}
      title={stream.ritual_name}
      trailing={streamTrailing(stream, accruals)}
    >
      <p className="text-[11px] text-zinc-400">{stream.ritual_tagline}</p>
      <p className="text-[10px] text-zinc-500">{stream.purpose_user_text}</p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Amount / period</p>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={nextAmt}
            onChange={(e) => setNextAmt(e.target.value)}
            className="h-8 w-28 rounded-[2px] border-[#1E2530] text-xs"
          />
        </div>
        <Button type="button" className="system-button text-[10px]" onClick={handlePatch}>
          Set amount
        </Button>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.1em] text-zinc-500">Periods</p>
        {(accruals ?? []).map((a) => {
          const claimable = !a.claimed_at && isClaimable(a.ready_at)
          return (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-[#1E2530]/80 px-2 py-1 text-[11px] text-zinc-300"
            >
              <span>
                {a.period_year}-{String(a.period_month).padStart(2, '0')} · {fmt(a.amount)}
                {a.claimed_at ? (
                  <span className="ml-2 text-emerald-400">claimed</span>
                ) : claimable ? (
                  <span className="ml-2 text-[#7DD3FC]">ready</span>
                ) : (
                  <span className="ml-2 text-zinc-500">locked</span>
                )}
              </span>
              {!a.claimed_at ? (
                <Button
                  type="button"
                  className="system-button px-2 py-1 text-[9px]"
                  disabled={!claimable || claimAccrual.isPending}
                  onClick={() => claimAccrual.mutateAsync(a.id)}
                >
                  Claim
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>
    </CollapsibleRow>
  )
}
