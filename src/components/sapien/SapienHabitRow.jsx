import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function SapienHabitRow({ habit, progress, onClaim, isClaiming }) {
  const { count, target, complete } = progress
  const progressLabel = habit.habit_kind === 'count' ? `${count}/${target}` : complete ? 'Done' : '—'

  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-3">
      <CardContent className="flex items-center justify-between gap-3 px-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white">{habit.title}</p>
          <p className="mt-0.5 font-mono text-[10px] text-[#A855F7]">
            +{habit.xp_per_claim} XP · {progressLabel}
          </p>
        </div>
        <Button
          type="button"
          className="system-button shrink-0 text-[10px]"
          disabled={complete || isClaiming}
          onClick={() => onClaim(habit)}
        >
          {complete ? 'DONE' : habit.habit_kind === 'count' ? 'CLAIM +1' : 'CLAIM'}
        </Button>
      </CardContent>
    </Card>
  )
}
