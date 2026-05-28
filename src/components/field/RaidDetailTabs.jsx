import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function RaidDetailTabs({ activeTab, onTabChange, tabs }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          type="button"
          className={cn('system-button w-full text-[10px]', activeTab === tab.id && 'system-button-active')}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}
