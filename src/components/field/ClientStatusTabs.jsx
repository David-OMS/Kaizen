import { Button } from '@/components/ui/button'
import { RAID_STATUS_OPTIONS } from '@/constants/fieldOptions'
import { cn } from '@/lib/utils'

export function ClientStatusTabs({ activeStatus, onStatusChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {RAID_STATUS_OPTIONS.map((status) => (
        <Button
          key={status}
          type="button"
          className={cn('system-button w-full text-[10px]', activeStatus === status && 'system-button-active')}
          onClick={() => onStatusChange(status)}
        >
          {status}
        </Button>
      ))}
    </div>
  )
}