import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const QUEST_SECTIONS = [
  { key: 'task_pool', label: 'Task Pool' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'log', label: 'Quest Log' },
]

export function QuestSectionTabs({ activeSection, onSectionChange }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {QUEST_SECTIONS.map((section) => (
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