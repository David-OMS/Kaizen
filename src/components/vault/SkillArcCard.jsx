import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ARC_QUEST_META } from '@/constants/skillArcMetadata'
import { SkillArcLinkForm } from '@/components/vault/SkillArcLinkForm'
import { SkillVerificationPanel } from '@/components/vault/SkillVerificationPanel'
import { useActivateSkillArc, useUpdateSkillArcStatus } from '@/hooks/useSkillArcMutations'

export function SkillArcCard({ arc, weeklyQuests, dailyQuests }) {
  const updateStatus = useUpdateSkillArcStatus()
  const activate = useActivateSkillArc()

  const meta = arc.metadata || {}
  const hasLinks = Boolean(meta[ARC_QUEST_META.WEEKLY]) && (meta[ARC_QUEST_META.DAILIES] || []).length >= 3

  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-3">
      <CardHeader className="px-4 pb-2">
        <CardTitle className="text-xs tracking-[0.14em] text-[#7DD3FC] uppercase italic">
          {arc.proposed_skill_name || 'Skill arc'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4">
        <span className="font-mono text-[10px] uppercase text-[#A855F7]">{arc.status}</span>

        {arc.status === 'proposed' ? (
          <Button
            type="button"
            className="system-button text-[10px]"
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: arc.id, status: 'accepted' })}
          >
            Accept proposal
          </Button>
        ) : null}

        {arc.status === 'accepted' && !hasLinks ? (
          <SkillArcLinkForm arcId={arc.id} weeklyQuests={weeklyQuests} dailyQuests={dailyQuests} />
        ) : null}

        {arc.status === 'accepted' && hasLinks ? (
          <Button
            type="button"
            className="system-button text-[10px]"
            disabled={activate.isPending}
            onClick={() => activate.mutateAsync(arc.id)}
          >
            Begin arc (active)
          </Button>
        ) : null}

        {arc.status === 'active' || arc.status === 'accepted' || arc.status === 'verification' ? (
          <Button
            type="button"
            className="system-button text-[10px]"
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: arc.id, status: 'paused' })}
          >
            Pause
          </Button>
        ) : null}

        {arc.status === 'verification' ? <SkillVerificationPanel arc={arc} /> : null}

        {activate.error ? <p className="text-[10px] text-red-300">{activate.error.message}</p> : null}
      </CardContent>
    </Card>
  )
}
