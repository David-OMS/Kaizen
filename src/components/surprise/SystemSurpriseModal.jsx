import { Sparkles, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS = {
  hunt: 'Hunt',
  raid: 'Raid',
  spoil: 'Spoils',
  profile: 'Hunter',
  quest: 'Quest',
  treasury: 'Treasury',
  meta: 'System',
}

export function SystemSurpriseModal({ open, surprise, onClose }) {
  if (!open || !surprise) return null

  const categoryLabel = CATEGORY_LABELS[surprise.category] ?? 'System'
  const xp = Number(surprise.xp_reward ?? 0)
  const isReward = surprise.kind === 'reward'
  const headerLabel = isReward ? 'SYSTEM REWARD' : 'ACHIEVEMENT UNLOCKED'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-title"
    >
      <div
        className={cn(
          'achievement-reveal-shell w-full max-w-md p-px',
          'rounded-sm bg-gradient-to-br from-[#7DD3FC]/90 via-[#1E2530] to-[#A855F7]/90',
          'shadow-[0_0_40px_rgba(125,211,252,0.12),0_0_60px_rgba(168,85,247,0.08)]',
        )}
      >
        <div className="achievement-reveal-inner relative overflow-hidden rounded-sm bg-[#0B0E12]/95 px-5 pb-5 pt-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              background:
                'repeating-linear-gradient(90deg, transparent, transparent 2px, #7DD3FC 2px, #7DD3FC 3px)',
            }}
          />
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#7DD3FC]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-[#A855F7]/20 blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            <div className="mb-1 flex items-center gap-2 text-[#A855F7]">
              <Trophy className="h-5 w-5 shrink-0 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" strokeWidth={1.75} />
              <Sparkles className="h-4 w-4 shrink-0 animate-pulse" strokeWidth={1.75} />
            </div>

            <p className="text-[9px] font-bold tracking-[0.35em] text-[#7DD3FC]">{headerLabel}</p>
            <p className="mt-2 text-[10px] tracking-[0.2em] text-zinc-500 uppercase">{categoryLabel}</p>

            <div className="my-4 w-full border-y border-[#1E2530]/80 py-4">
              <h2
                id="achievement-title"
                className="achievement-reveal-title text-2xl font-black uppercase italic leading-tight tracking-wide text-[#7DD3FC] drop-shadow-[0_0_12px_rgba(125,211,252,0.35)] md:text-[1.65rem]"
              >
                {surprise.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">{surprise.description}</p>
            </div>

            {xp !== 0 ? (
              <div className="mb-5 flex w-full items-center justify-center gap-2 rounded-sm border border-[#7DD3FC]/25 bg-[#12161D]/90 py-3">
                <span className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase">Reward</span>
                <span className="font-mono text-3xl font-bold tabular-nums text-white">
                  {xp > 0 ? '+' : ''}
                  {xp}
                </span>
                <span className="text-xs font-bold tracking-[0.15em] text-[#A855F7] uppercase">XP</span>
              </div>
            ) : isReward ? (
              <div className="mb-5 w-full rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-3">
                <p className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase">Experience</p>
                <p className="mt-1 font-mono text-lg text-zinc-400">No XP granted</p>
              </div>
            ) : null}

            <Button type="button" className="system-button system-button-active w-full text-[10px]" onClick={onClose}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
