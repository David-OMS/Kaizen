import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CollapsibleRow({ expanded, onToggle, title, trailing, children, titleClassName }) {
  return (
    <div className="overflow-hidden rounded-sm border border-[#1E2530] bg-[#12161D]/40">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-zinc-500 transition-transform', expanded && 'rotate-180')}
        />
        <span
          className={cn('min-w-0 flex-1 truncate font-mono text-sm text-[#7DD3FC]', titleClassName)}
        >
          {title}
        </span>
        {trailing ? <span className="shrink-0 font-mono text-xs text-zinc-400">{trailing}</span> : null}
      </button>
      {expanded ? <div className="space-y-2 border-t border-[#1E2530] px-3 pb-3 pt-2">{children}</div> : null}
    </div>
  )
}
