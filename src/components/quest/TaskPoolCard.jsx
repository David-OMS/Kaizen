import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { canMarkTaskPoolComplete, isLongWeeklyTrack } from '@/utils/taskPoolComplete'
import {
  getActivePhase,
  getPhases,
  isMultiDayProject,
  isWeeklyQuotaTask,
  projectProgressLabel,
  quotaProgressLabel,
} from '@/utils/taskPoolProject'
import { usePatchTaskPoolQuota, useRestructureTaskPoolProject } from '@/hooks/useTaskPoolMutations'

function scheduleLabel(task) {
  if (isMultiDayProject(task)) return 'Multi-day project'
  if (isWeeklyQuotaTask(task)) return 'Weekly quota'
  if (isLongWeeklyTrack(task)) return 'Weekly track'
  return 'One-shot'
}

export function TaskPoolCard({ task, onFinishTrack, isFinishPending, finishError }) {
  const restructure = useRestructureTaskPoolProject()
  const patchQuota = usePatchTaskPoolQuota()
  const [showRestructure, setShowRestructure] = useState(false)
  const [extraContext, setExtraContext] = useState('')
  const [quotaDraft, setQuotaDraft] = useState(String(task.weekly_quota_target ?? 2))

  const isLongTrack = isLongWeeklyTrack(task)
  const showFinishTrack = canMarkTaskPoolComplete(task)
  const multiDay = isMultiDayProject(task)
  const weeklyQuota = isWeeklyQuotaTask(task)
  const activePhase = multiDay ? getActivePhase(task) : null
  const phases = multiDay ? getPhases(task) : []

  const handleRestructure = async () => {
    if (!extraContext.trim()) return
    await restructure.mutateAsync({ taskId: task.id, additionalContext: extraContext.trim() })
    setExtraContext('')
    setShowRestructure(false)
  }

  const handleQuotaSave = async () => {
    const next = Math.min(14, Math.max(1, Number(quotaDraft) || 1))
    await patchQuota.mutateAsync({ taskId: task.id, weeklyQuotaTarget: next })
    setQuotaDraft(String(next))
  }

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
          {scheduleLabel(task)} · {task.repeat_policy}
          {Number(task.times_assigned || 0) > 0 ? ` · assigned ${task.times_assigned}×` : ' · not assigned yet'}
        </p>

        {multiDay && phases.length ? (
          <div className="space-y-1 rounded-sm border border-[#1E2530]/80 px-2 py-2">
            <p className="text-[10px] uppercase tracking-wide text-[#7DD3FC]">
              {projectProgressLabel(task)}
              {activePhase ? ` · now: ${activePhase.title}` : ' · done'}
            </p>
            <ul className="space-y-0.5 text-[11px] text-zinc-400">
              {phases.map((phase) => (
                <li key={phase.index}>
                  Day {Number(phase.index) + 1}: {phase.title}
                  {phase.status === 'completed' ? ' ✓' : phase.index === activePhase?.index ? ' →' : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {weeklyQuota ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[#7DD3FC]">
              {quotaProgressLabel(task)}
            </span>
            <Input
              type="number"
              min={1}
              max={14}
              value={quotaDraft}
              onChange={(e) => setQuotaDraft(e.target.value)}
              className="h-7 w-14 rounded-[2px] border-[#1E2530] text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              className="h-7 px-2 text-[10px] text-zinc-400"
              disabled={patchQuota.isPending}
              onClick={handleQuotaSave}
            >
              {patchQuota.isPending ? '…' : 'Set quota'}
            </Button>
          </div>
        ) : null}

        {task.mandatory ? (
          <p className="text-[10px] uppercase tracking-wide text-[#A855F7]">Mandatory</p>
        ) : null}

        {multiDay ? (
          <div className="space-y-2 pt-1">
            {!showRestructure ? (
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start p-0 text-[10px] text-zinc-400"
                onClick={() => setShowRestructure(true)}
              >
                Add context & restructure plan
              </Button>
            ) : (
              <>
                <textarea
                  rows={3}
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="New info or scope change — completed days are kept."
                  className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 text-[10px] text-zinc-400"
                    onClick={() => {
                      setShowRestructure(false)
                      setExtraContext('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="h-7 text-[10px]"
                    disabled={restructure.isPending || !extraContext.trim()}
                    onClick={handleRestructure}
                  >
                    {restructure.isPending ? 'Updating…' : 'Update plan'}
                  </Button>
                </div>
                {restructure.error ? (
                  <p className="text-[10px] text-[#FF4B4B]">{restructure.error.message}</p>
                ) : null}
              </>
            )}
          </div>
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
