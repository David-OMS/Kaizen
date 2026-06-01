import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QUEST_REWARD_VISIBILITY, QUEST_SOURCE_TYPES } from '@/constants/questEngine'
import { isSundayMentalQuest } from '@/utils/sundayProvision'
import { QUEST_KIND, QUEST_STATUS } from '@/constants/questLifecycle'
import { AttemptFailQuestForm } from '@/components/quest/AttemptFailQuestForm'
import { IncompleteQuestForm } from '@/components/quest/IncompleteQuestForm'
import { QuestAssessmentModal } from '@/components/quest/QuestAssessmentModal'
import { BattleIntelModal } from '@/components/quest/BattleIntelModal'

export function QuestCard({
  quest,
  profile,
  poolAlreadyComplete = false,
  onComplete,
  onBattleIntel,
  onAttemptFail,
  onIncomplete,
  onVoidDuplicate,
  onDismissDuplicate,
  isDuplicateCopy = false,
  isBattleIntelPending,
  battleIntelError,
  isResolving,
  isIncompletePending,
  isAttemptFailPending,
  isVoidDuplicatePending,
  isDismissDuplicatePending,
  incompleteError,
  attemptFailError,
  voidDuplicateError,
  dismissDuplicateError,
}) {
  const [showIncomplete, setShowIncomplete] = useState(false)
  const [showAttemptFail, setShowAttemptFail] = useState(false)
  const [assessOpen, setAssessOpen] = useState(false)
  const [battleIntelOpen, setBattleIntelOpen] = useState(false)

  const isActive = [QUEST_STATUS.ACTIVE, QUEST_STATUS.EXTENDED].includes(quest.status)
  const isAssessmentPending = quest.status === QUEST_STATUS.ASSESSMENT_PENDING
  const rewardHidden = quest.reward_visibility === QUEST_REWARD_VISIBILITY.UNKNOWN
  const hasXpEconomy =
    quest.quest_kind !== QUEST_KIND.LEARNING &&
    (Number(quest.xp_reward || 0) > 0 || Number(quest.xp_penalty || 0) > 0)
  const isLearning = quest.quest_kind === QUEST_KIND.LEARNING
  const isRecall = Boolean(quest.is_micro || quest.recall_kind)
  const isSundayMental = isSundayMentalQuest(quest)
  const journalPrompt = quest.analysis_snapshot?.journal_prompt
  const showForms = showIncomplete || showAttemptFail

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
            {isRecall ? <span className="text-[#A855F7]">Recall</span> : null}
            {isLearning ? <span className="text-[#7DD3FC]">Learning</span> : null}
            {quest.load_points ? <span>{quest.load_points} load</span> : null}
            {quest.source_type === QUEST_SOURCE_TYPES.AI_GENERATED ? (
              <span>AI</span>
            ) : null}
            {quest.source_type === QUEST_SOURCE_TYPES.CURIOSITY ? (
              <span className="text-[#A855F7]">Curiosity</span>
            ) : null}
            {isSundayMental ? <span className="text-[#A855F7]">Sunday</span> : null}
          </div>

          {isSundayMental && journalPrompt ? (
            <p className="text-sm leading-relaxed text-zinc-300">{journalPrompt}</p>
          ) : null}

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

          {isActive && poolAlreadyComplete ? (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">
                This pool task is already marked complete. Remove this duplicate without XP.
              </p>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-[10px] text-zinc-400"
                disabled={isVoidDuplicatePending}
                onClick={() => onVoidDuplicate?.()}
              >
                {isVoidDuplicatePending ? 'Removing…' : 'Remove duplicate'}
              </Button>
              {voidDuplicateError ? (
                <p className="text-xs text-[#FF4B4B]">{voidDuplicateError}</p>
              ) : null}
            </div>
          ) : null}

          {isActive && !isDuplicateCopy && !poolAlreadyComplete && !showForms ? (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                className="system-button w-full text-[10px]"
                disabled={isResolving || isBattleIntelPending}
                onClick={() => {
                  if (isLearning && onBattleIntel) {
                    setBattleIntelOpen(true)
                    return
                  }
                  onComplete()
                }}
              >
                {isLearning ? 'Done (study)' : 'Complete'}
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 text-[10px] text-zinc-400"
                  onClick={() => {
                    setShowAttemptFail(false)
                    setShowIncomplete(true)
                  }}
                >
                  Need more time…
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 text-[10px] text-zinc-400"
                  onClick={() => {
                    setShowIncomplete(false)
                    setShowAttemptFail(true)
                  }}
                >
                  Tried, couldn&apos;t…
                </Button>
              </div>
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

          {showAttemptFail ? (
            <AttemptFailQuestForm
              isPending={isAttemptFailPending}
              error={attemptFailError}
              onSubmit={(reason) => {
                onAttemptFail?.(reason)
                setShowAttemptFail(false)
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

      <BattleIntelModal
        quest={quest}
        open={battleIntelOpen}
        onClose={() => setBattleIntelOpen(false)}
        isPending={isBattleIntelPending}
        error={battleIntelError}
        onSubmit={async (intel) => {
          await onBattleIntel?.(intel)
          setBattleIntelOpen(false)
        }}
      />
    </>
  )
}
