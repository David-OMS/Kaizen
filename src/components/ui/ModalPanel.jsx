import { cn } from '@/lib/utils'

export function ModalPanel({ open, title, onClose, children, className }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className={cn('w-full max-w-lg rounded-sm border border-[#1E2530] bg-[#12161D] p-4', className)}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm tracking-[0.14em] text-[#7DD3FC] uppercase italic">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="system-button px-2 py-1 text-[10px]"
            aria-label="Close modal"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}