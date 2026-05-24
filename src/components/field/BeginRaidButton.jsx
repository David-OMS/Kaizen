import { Button } from '@/components/ui/button'
import { useBeginRaid } from '@/hooks/useClientMutations'

export function BeginRaidButton({ client }) {
  const beginRaid = useBeginRaid()

  if (client.raid_status !== 'pending') return null

  return (
    <Button
      type="button"
      className="system-button w-full text-[10px]"
      disabled={beginRaid.isPending}
      onClick={() => beginRaid.mutate(client)}
    >
      {beginRaid.isPending ? 'BEGINNING…' : 'Begin raid'}
    </Button>
  )
}
