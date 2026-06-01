import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useExtraDailyQuest } from '@/hooks/useExtraDailyQuest'
import { getExtraDailyRemainderWindow } from '@/utils/extraDailyRemainder'
import { getProfileTimezone } from '@/utils/questTimezone'

export function ExtraDailyQuestPanel({ profile }) {
  const extra = useExtraDailyQuest()
  const window = useMemo(() => {
    if (!profile) return null
    return getExtraDailyRemainderWindow(getProfileTimezone(profile))
  }, [profile])

  if (!profile || !window) return null

  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/60 py-2">
      <CardContent className="space-y-2 px-4 py-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#7DD3FC]">Extra daily</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {window.label} Picks from your pool when possible; otherwise AI drafts one for the time left.
            </p>
          </div>
          <Button
            type="button"
            className="system-button shrink-0 text-[10px]"
            disabled={extra.isPending}
            onClick={() => extra.mutate(profile)}
          >
            {extra.isPending ? 'Assigning…' : 'Get extra task'}
          </Button>
        </div>
        {extra.isError ? <p className="text-xs text-[#FF4B4B]">{extra.error.message}</p> : null}
        {extra.isSuccess ? (
          <p className="text-xs text-[#7DD3FC]">Added: {extra.data.quest?.title}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
