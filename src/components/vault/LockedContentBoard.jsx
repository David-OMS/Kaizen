import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLockedContent } from '@/hooks/useLockedContent'

export function LockedContentBoard() {
  const lockedContentQuery = useLockedContent()

  if (lockedContentQuery.isLoading) {
    return (
      <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
        <CardContent className="px-4 text-sm text-zinc-300">Loading locked content...</CardContent>
      </Card>
    )
  }

  if (lockedContentQuery.isError) {
    return (
      <Card className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8 py-4">
        <CardContent className="px-4 text-sm text-red-100">{lockedContentQuery.error.message}</CardContent>
      </Card>
    )
  }

  const items = lockedContentQuery.data

  if (!items.length) {
    return (
      <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
        <CardContent className="px-4 text-sm text-zinc-300">No locked content configured yet.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
          <CardHeader className="px-4 pb-2">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-sm tracking-[0.12em] text-[#7DD3FC] uppercase italic">
                {item.title}
              </CardTitle>
              <span className="rounded-sm border border-[#1E2530] px-2 py-1 text-[10px] text-zinc-200 uppercase">
                {item.unlocked ? 'unlocked' : 'locked'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 px-4 text-sm text-zinc-300">
            <p>Type: {item.type}</p>
            <p>{item.description || '-'}</p>
            <p>Unlock rank: {item.unlock_rank || '-'}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}