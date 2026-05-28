import { SAPIEN_INTEGRATION_MAX, SAPIEN_INTEGRATION_MIN } from '@/constants/sapienHabitXp'
import { cn } from '@/lib/utils'

const LEVELS = Array.from(
  { length: SAPIEN_INTEGRATION_MAX - SAPIEN_INTEGRATION_MIN + 1 },
  (_, i) => i + SAPIEN_INTEGRATION_MIN,
)

export function SapienIntegrationPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          className={cn(
            'flex-1 rounded-[2px] border py-2 font-mono text-sm',
            value === level ? 'border-[#A855F7] text-[#A855F7]' : 'border-[#1E2530] text-zinc-500',
          )}
          onClick={() => onChange(level)}
        >
          {level}
        </button>
      ))}
    </div>
  )
}
