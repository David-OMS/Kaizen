import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { canMarkTaskPoolComplete, isLongWeeklyTrack } from '@/utils/taskPoolComplete'

export function TaskPoolCard({ task, onFinishTrack, isFinishPending, finishError }) {
  const isLongTrack = isLongWeeklyTrack(task)
  const showFinishTrack = canMarkTaskPoolComplete(task)

  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
      <CardHeader className="px-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm tracking-[0.12em] text-[#7DD3FC] uppercase italic">
            {task.title}
          </CardTitle>
          <span className="rounded-sm border border-[#1E2530] px-2 py-1 text-[10px] text-zinc-200 uppercase">
            {task.quest_kind || 'task'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 text-sm text-zinc-300">
        <p>Context: {task.context_note || '—'}</p>
        <p className="font-mono text-[10px] text-zinc-500">
          {isLongTrack ? 'Weekly track' : 'One-shot'} · {task.repeat_policy}
          {Number(task.times_assigned || 0) > 0 ? ` · assigned ${task.times_assigned}×` : ' · not assigned yet'}
        </p>
        {task.mandatory ? (
          <p className="text-[10px] uppercase tracking-wide text-[#A855F7]">Mandatory</p>
        ) : null}
        {showFinishTrack ? (
          <div className="pt-1">
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start p-0 text-[10px] text-zinc-400"
              disabled={isFinishPending}
              onClick={() => onFinishTrack?.(task.id)}
            >
              {isFinishPending ? 'Closing…' : 'Finish track'}
            </Button>
            {finishError ? <p className="text-[10px] text-[#FF4B4B]">{finishError}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
