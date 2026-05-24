import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { key: 'xp_log', label: 'XP Log' },
  { key: 'achievements', label: 'Achievements' },
  { key: 'locked_content', label: 'Locked Content' },
]

export function VaultSectionTabs({ activeSection, onSectionChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SECTIONS.map((section) => (
        <Button
          key={section.key}
          type="button"
          className={cn('system-button w-full text-[10px]', activeSection === section.key && 'system-button-active')}
          onClick={() => onSectionChange(section.key)}
        >
          {section.label}
        </Button>
      ))}
    </div>
  )
}