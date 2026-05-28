import { APP_MODE, useAppMode } from '@/context/AppModeContext'
import { cn } from '@/lib/utils'

export function ModeToggle() {
  const { mode, setMode } = useAppMode()

  return (
    <div className="flex rounded-sm border border-[#1E2530] p-0.5">
      <button
        type="button"
        className={cn(
          'px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] uppercase transition-colors',
          mode === APP_MODE.SAPIEN ? 'bg-[#A855F7]/20 text-[#A855F7]' : 'text-zinc-500',
        )}
        onClick={() => setMode(APP_MODE.SAPIEN)}
      >
        Sapien
      </button>
      <button
        type="button"
        className={cn(
          'px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] uppercase transition-colors',
          mode === APP_MODE.HUNTER ? 'bg-[#7DD3FC]/20 text-[#7DD3FC]' : 'text-zinc-500',
        )}
        onClick={() => setMode(APP_MODE.HUNTER)}
      >
        Hunter
      </button>
    </div>
  )
}
