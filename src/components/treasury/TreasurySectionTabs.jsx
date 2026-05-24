import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'received', label: 'Received' },
  { id: 'outstanding', label: 'Outstanding' },
  { id: 'expenses', label: 'Expenses' },
]

export function TreasurySectionTabs({ activeSection, onSectionChange, outstandingCount }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SECTIONS.map((section) => (
        <Button
          key={section.id}
          type="button"
          className={cn(
            'system-button w-full text-[10px]',
            activeSection === section.id && 'system-button-active',
          )}
          onClick={() => onSectionChange(section.id)}
        >
          {section.id === 'outstanding' && outstandingCount > 0
            ? `${section.label} (${outstandingCount})`
            : section.label}
        </Button>
      ))}
    </div>
  )
}
