import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTaskPool } from '@/hooks/useTaskPool'

export function TaskPoolList() {
  const taskPoolQuery = useTaskPool()

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

  const tasks = taskPoolQuery.data
  if (!tasks.length) {
    return (
      <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
        <CardContent className="px-4 text-sm text-zinc-300">Task pool is empty. Add your first task.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id} className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
          <CardHeader className="px-4 pb-2">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-sm tracking-[0.12em] text-[#7DD3FC] uppercase italic">
                {task.title}
              </CardTitle>
              <span className="rounded-sm border border-[#1E2530] px-2 py-1 text-[10px] text-zinc-200 uppercase">
                {task.type}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-4 text-sm text-zinc-300">
            <p>Context: {task.context_note || '-'}</p>
            <p>Assignments: {task.times_assigned ?? 0}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}