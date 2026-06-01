import { ModalPanel } from '@/components/ui/ModalPanel'
import { Button } from '@/components/ui/button'
import { BRAIN_TEASER_MODAL_TITLE } from '@/constants/brainTeaser'

export function DailyBrainTeaserModal({ open, fact, onClose, dismissed = false }) {
  return (
    <ModalPanel open={open} title={BRAIN_TEASER_MODAL_TITLE} onClose={onClose} className="max-w-md">
      <div className="space-y-4 text-sm text-zinc-300">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#A855F7]">Today&apos;s oddment</p>
        <p className="text-base leading-relaxed text-white">{fact}</p>
        <p className="font-mono text-[10px] text-zinc-500">
          One drop per day · never repeats
          {dismissed ? ' · reopen anytime from the Cipher drop chip' : ''}
        </p>
        <Button type="button" className="system-button w-full text-[10px]" onClick={onClose}>
          {dismissed ? 'CLOSE' : 'NOT NOW'}
        </Button>
      </div>
    </ModalPanel>
  )
}
