import { Button } from '@/components/ui/button'
import { useCompleteRaid } from '@/hooks/useClientMutations'

export function CompleteRaidButton({ client }) {
  const completeRaid = useCompleteRaid()

  if (client.raid_status !== 'ongoing') return null

  return (
    <Button
      type="button"
      className="system-button w-full text-[10px]"
      disabled={completeRaid.isPending}
      onClick={() => completeRaid.mutate(client)}
    >
      {completeRaid.isPending ? 'CLEARING…' : 'Complete raid'}
    </Button>
  )
}
