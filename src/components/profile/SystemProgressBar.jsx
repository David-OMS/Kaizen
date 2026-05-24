import { cn } from '@/lib/utils'

export function SystemProgressBar({ value, className }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))

  return (
    <div
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-3 w-full overflow-hidden rounded-[2px] border border-[#1E2530] bg-black', className)}
    >
      <div
        className="progress-energy h-full rounded-[1px] transition-[width] duration-300"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}