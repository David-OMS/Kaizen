import { Loader2 } from 'lucide-react'

export function SurprisePendingOverlay({ open }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[99] flex items-center justify-center bg-black/75 px-4 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label="The System is processing"
    >
      <div className="surprise-pending-shell w-full max-w-xs rounded-sm border border-[#1E2530] bg-[#0B0E12]/95 px-6 py-8 text-center shadow-[0_0_32px_rgba(125,211,252,0.12)]">
        <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#7DD3FC]/20" />
          <span className="absolute inset-1 animate-pulse rounded-full border border-[#A855F7]/40" />
          <Loader2 className="relative h-7 w-7 animate-spin text-[#7DD3FC]" strokeWidth={2} />
        </div>
        <p className="text-[9px] font-bold tracking-[0.32em] text-[#A855F7] uppercase">System processing</p>
        <p className="mt-2 text-sm text-zinc-400">Stand by, Hunter.</p>
      </div>
    </div>
  )
}
