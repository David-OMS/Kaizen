import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCuriosityMutations, useCuriosityState } from '@/hooks/useCuriosity'

export function CuriosityBanner({ profile }) {
  const state = useCuriosityState(profile)
  const { completeBook, setEnabled, refreshThemes } = useCuriosityMutations()

  if (!state.enabled) {
    return (
      <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/60 py-2">
        <CardContent className="flex items-center justify-between gap-2 px-4 py-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Curiosity off</p>
          <Button
            type="button"
            variant="ghost"
            className="h-auto p-0 text-[10px] text-[#7DD3FC]"
            onClick={() => setEnabled.mutate(true)}
          >
            Enable
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (state.pending) {
    return (
      <Card className="rounded-sm border border-[#A855F7]/30 bg-[#12161D]/90 py-3">
        <CardContent className="px-4">
          <p className="text-[10px] tracking-[0.14em] text-[#A855F7] uppercase">Curiosity</p>
          <p className="mt-1 text-sm text-zinc-300">
            Country & profession themes start <span className="text-white">{state.startsOn}</span> (Monday).
          </p>
          {state.book ? (
            <p className="mt-1 font-mono text-[11px] text-zinc-400">Book this month: {state.book}</p>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-sm border border-[#A855F7]/30 bg-[#12161D]/90 py-3">
      <CardContent className="space-y-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] tracking-[0.14em] text-[#A855F7] uppercase">Curiosity</p>
          <Button
            type="button"
            variant="ghost"
            className="h-auto p-0 text-[10px] text-zinc-500"
            onClick={() => refreshThemes.mutate(profile)}
            disabled={refreshThemes.isPending}
          >
            {refreshThemes.isPending ? '…' : 'Reroll themes'}
          </Button>
        </div>
        <p className="text-[11px] text-zinc-500">
          Broadening lens — countries, professions, and books outside your task pool. Reroll for a new
          random week (book / country / profession).
        </p>
        <p className="text-sm text-white">
          {state.book ? (
            <>
              <span className="text-zinc-400">Book · </span>
              {state.book}
            </>
          ) : (
            <span className="text-zinc-500">No book set</span>
          )}
        </p>
        <p className="text-sm text-white">
          <span className="text-zinc-400">Profession · </span>
          {state.profession || '—'}
          <span className="text-zinc-500"> · </span>
          <span className="text-zinc-400">Country · </span>
          {state.country || '—'}
        </p>
        {state.needsWrapUp ? (
          <p className="text-[11px] text-[#7DD3FC]">Complete the wrap-up quest to unlock next week&apos;s themes.</p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          {state.book ? (
            <Button
              type="button"
              className="system-button text-[10px]"
              disabled={completeBook.isPending}
              onClick={() => completeBook.mutate(profile)}
            >
              {completeBook.isPending ? '…' : 'Book finished'}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="h-8 text-[10px] text-zinc-500"
            onClick={() => setEnabled.mutate(false)}
          >
            Turn off
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
