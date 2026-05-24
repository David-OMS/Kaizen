import { cn } from '@/lib/utils'

export function RankBadge({ rank }) {
  return (
    <div
      className={cn(
        'rank-badge relative inline-flex min-w-20 items-center justify-center px-4 py-1 text-sm font-black tracking-[0.18em] text-[#7DD3FC] uppercase',
      )}
    >
      {rank}
    </div>
  )
}