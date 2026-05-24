import { Button } from '@/components/ui/button'
import { useAnalyzeRaid } from '@/hooks/useAnalyzeRaid'

export function RaidAnalyzeButton({ client }) {
  const analyze = useAnalyzeRaid()

  return (
    <Button
      type="button"
      className="system-button text-[10px]"
      disabled={analyze.isPending}
      onClick={() =>
        analyze.mutate({
          clientId: client.id,
          title: client.name,
          description: client.project_name || '',
          scopeHints: client.notes || '',
          existingSnapshot: client.analysis_snapshot,
        })
      }
    >
      {analyze.isPending ? 'ANALYZING…' : 'RE-ANALYZE RANK'}
    </Button>
  )
}
