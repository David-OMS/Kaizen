import { useState } from 'react'
import { DailyBrainTeaserModal } from '@/components/home/DailyBrainTeaserModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { hasBrainTeaserForToday } from '@/services/brainTeaserService'
import { getProfileTimezone, getTodayYmdInTimezone } from '@/utils/questTimezone'

export function CipherDropBanner({ profile }) {
  const [open, setOpen] = useState(false)

  if (!profile) return null

  const ymd = getTodayYmdInTimezone(getProfileTimezone(profile))
  if (!hasBrainTeaserForToday(profile, ymd)) return null

  const fact = profile.daily_brain_teaser_fact

  return (
    <>
      <Card className="rounded-sm border border-[#A855F7]/30 bg-[#12161D]/90 py-2">
        <CardContent className="flex items-center justify-between gap-3 px-4 py-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#A855F7]">Cipher drop</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">Today&apos;s oddment is saved — read whenever.</p>
          </div>
          <Button
            type="button"
            className="system-button shrink-0 text-[10px]"
            onClick={() => setOpen(true)}
          >
            Read
          </Button>
        </CardContent>
      </Card>
      <DailyBrainTeaserModal open={open} fact={fact} onClose={() => setOpen(false)} dismissed />
    </>
  )
}
