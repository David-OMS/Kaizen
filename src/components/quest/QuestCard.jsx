import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QUEST_REWARD_VISIBILITY, QUEST_SOURCE_TYPES } from '@/constants/questEngine'
import { QUEST_KIND, QUEST_STATUS } from '@/constants/questLifecycle'
import { IncompleteQuestForm } from '@/components/quest/IncompleteQuestForm'
import { QuestAssessmentModal } from '@/components/quest/QuestAssessmentModal'

export function QuestCard({
  quest,
  profile,
  onComplete,
  onFail,
  onIncomplete,
  isResolving,
  isIncompletePending,
  incompleteError,
}) {
  const [showIncomplete, setShowIncomplete] = useState(false)
  const [assessOpen, setAssessOpen] = useState(false)

  const isActive = [QUEST_STATUS.ACTIVE, QUEST_STATUS.EXTENDED].includes(quest.status)
  const isAssessmentPending = quest.status === QUEST_STATUS.ASSESSMENT_PENDING
  const rewardHidden = quest.reward_visibility === QUEST_REWARD_VISIBILITY.UNKNOWN
  const hasXpEconomy =
    quest.quest_kind !== QUEST_KIND.LEARNING &&
    (Number(quest.xp_reward || 0) > 0 || Number(quest.xp_penalty || 0) > 0)
  const isLearning = quest.quest_kind === QUEST_KIND.LEARNING

  return (
    <>
      <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
        <CardHeader className="px-4 pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-sm tracking-[0.12em] text-[#7DD3FC] uppercase italic">
              {quest.title}
            </CardTitle>
            <span className="rounded-sm border border-[#1E2530] px-2 py-1 text-[10px] text-zinc-200 uppercase">
              {quest.status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-4 text-sm text-zinc-300">
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-zinc-500">
            {quest.carryover ? <span className="text-[#A855F7]">Carryover</span> : null}
            {isLearning ? <span className="text-[#7DD3FC]">Learning</span> : null}
            {quest.load_points ? <span>{quest.load_points} load</span> : null}
            {quest.source_type === QUEST_SOURCE_TYPES.AI_GENERATED ? (
              <span>AI</span>
            ) : null}
          </div>

          {hasXpEconomy ? (
            <>
              <p>
                Reward:{' '}
                {rewardHidden ? (
                  <span className="font-mono text-[#7DD3FC]">?</span>
                ) : (
                  <span>+{quest.xp_reward} XP</span>
                )}
              </p>
              <p>Penalty: -{quest.xp_penalty} XP</p>
            </>
          ) : isLearning ? (
            <p className="text-xs text-zinc-500">XP on assessment pass</p>
          ) : null}

          <p>Due: {quest.due_date}</p>

          {isAssessmentPending ? (
            <Button
              type="button"
              className="system-button w-full text-[10px]"
              onClick={() => setAssessOpen(true)}
            >
              Take assessment
            </Button>
          ) : null}

          {isActive && !showIncomplete ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="system-button flex-1 text-[10px]"
                  disabled={isResolving}
                  onClick={onComplete}
                >
                  {isLearning ? 'Done (study)' : 'Complete'}
                </Button>
                <Button
                  type="button"
                  className="system-button flex-1 text-[10px]"
                  disabled={isResolving}
                  onClick={onFail}
                >
                  Fail
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="text-[10px] text-zinc-400"
                onClick={() => setShowIncomplete(true)}
              >
                Incomplete…
              </Button>
            </div>
          ) : null}

          {showIncomplete ? (
            <IncompleteQuestForm
              isPending={isIncompletePending}
              error={incompleteError}
              onSubmit={(reason) => {
                onIncomplete?.(reason)
                setShowIncomplete(false)
              }}
            />
          ) : null}
        </CardContent>
      </Card>

      <QuestAssessmentModal
        quest={quest}
        profile={profile}
        open={assessOpen}
        onClose={() => setAssessOpen(false)}
      />
    </>
  )
}
