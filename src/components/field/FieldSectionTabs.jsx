import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function FieldSectionTabs({ activeSection, onSectionChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        className={cn('system-button w-full text-[10px]', activeSection === 'clients' && 'system-button-active')}
        onClick={() => onSectionChange('clients')}
      >
        Raids
      </Button>
      <Button
        type="button"
        className={cn('system-button w-full text-[10px]', activeSection === 'reachouts' && 'system-button-active')}
        onClick={() => onSectionChange('reachouts')}
      >
        Hunts
      </Button>
    </div>
  )
}