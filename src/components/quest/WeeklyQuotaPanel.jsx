import { Card, CardContent } from '@/components/ui/card'
import { useTaskPool } from '@/hooks/useTaskPool'
import { getProfileTimezone, getTodayYmdInTimezone } from '@/utils/questTimezone'
import { mondayOfWeekYmd } from '@/utils/curiosityPeriod'
import { isWeeklyQuotaTask, quotaProgressLabel } from '@/utils/taskPoolProject'
import { weeklyQuotaMet } from '@/utils/taskPoolQuota'

export function WeeklyQuotaPanel({ profile }) {
  const poolQuery = useTaskPool()
  const today = profile ? getTodayYmdInTimezone(getProfileTimezone(profile)) : null
  const weekStart = today ? mondayOfWeekYmd(today) : null

  const openQuotas = (poolQuery.data ?? []).filter((task) => {
    if (!isWeeklyQuotaTask(task)) return false
    if (task.last_outcome === 'completed') return false
    return !weeklyQuotaMet(task)
  })

  if (!openQuotas.length) return null

  return (
    <Card className="rounded-sm border border-[#7DD3FC]/25 bg-[#12161D]/90 py-3">
      <CardContent className="space-y-2 px-4">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#7DD3FC]">Weekly quotas</p>
        <p className="text-xs text-zinc-400">
          These are active all week ({weekStart} → Sunday). Progress updates when you complete a daily
          quest from that task. One may land on your Daily board on provision days when there is budget
          — not every morning.
        </p>
        <ul className="space-y-2">
          {openQuotas.map((task) => (
            <li
              key={task.id}
              className="rounded-sm border border-[#1E2530] px-2 py-1.5 text-sm text-zinc-200"
            >
              <span className="text-white">{task.title}</span>
              <span className="ml-2 font-mono text-[10px] text-[#7DD3FC]">
                {quotaProgressLabel(task)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
