import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TaskPoolCard } from '@/components/quest/TaskPoolCard'
import { TaskPoolCompletedSection } from '@/components/quest/TaskPoolCompletedSection'
import { useMarkTaskPoolComplete } from '@/hooks/useTaskPoolMutations'
import { useTaskPool } from '@/hooks/useTaskPool'
import { partitionTaskPool } from '@/utils/taskPoolComplete'

export function TaskPoolList() {
  const taskPoolQuery = useTaskPool()
  const markComplete = useMarkTaskPoolComplete()

  if (taskPoolQuery.isLoading) {
    return <Skeleton className="h-40 rounded-sm border border-[#1E2530] bg-[#12161D]" />
  }

  if (taskPoolQuery.isError) {
    return (
      <Card className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8 py-4">
        <CardContent className="px-4 text-sm text-red-100">{taskPoolQuery.error.message}</CardContent>
      </Card>
    )
  }

  const { active, completed } = partitionTaskPool(taskPoolQuery.data)

  if (!active.length && !completed.length) {
    return (
      <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
        <CardContent className="px-4 text-sm text-zinc-300">Task pool is empty. Add your first task.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {active.length ? (
        <div className="space-y-3">
          {active.map((task) => (
            <TaskPoolCard
              key={task.id}
              task={task}
              isFinishPending={markComplete.isPending}
              finishError={markComplete.error?.message}
              onFinishTrack={(taskId) => markComplete.mutate(taskId)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No open tasks in the pool.</p>
      )}
      <TaskPoolCompletedSection tasks={completed} />
    </div>
  )
}
