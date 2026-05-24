import { Button } from '@/components/ui/button'

export function TreasuryActions({ onOpenExpenseModal }) {
  return (
    <div className="flex justify-end">
      <Button type="button" className="system-button text-[10px]" onClick={onOpenExpenseModal}>
        Add expense
      </Button>
    </div>
  )
}
