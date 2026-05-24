import { useEffect, useState } from 'react'
import { ModalPanel } from '@/components/ui/ModalPanel'
import { Button } from '@/components/ui/button'
import { useQuestAssessment } from '@/hooks/useQuestLifecycleMutations'

export function QuestAssessmentModal({ quest, profile, open, onClose }) {
  const { gen, submit } = useQuestAssessment()
  const [answers, setAnswers] = useState([])

  const questions = quest?.assessment_snapshot?.questions ?? []

  useEffect(() => {
    if (!open || !quest) return
    if (questions.length) return
    gen.mutate(quest)
  }, [open, quest?.id])

  useEffect(() => {
    const qs = gen.data?.questions ?? quest?.assessment_snapshot?.questions ?? []
    setAnswers(qs.map(() => ''))
  }, [gen.data, quest?.assessment_snapshot])

  const displayQuestions = gen.data?.questions ?? questions

  if (!quest) return null

  return (
    <ModalPanel open={open} title="Learning assessment" onClose={onClose} className="max-h-[85vh] overflow-y-auto">
      <div className="space-y-3 text-sm text-zinc-300">
        <p className="text-xs text-zinc-500">Complete today to earn XP. {quest.title}</p>
        {gen.isPending ? <p className="text-xs text-zinc-500">Generating questions…</p> : null}
        {displayQuestions.map((q, i) => (
          <div key={q.id} className="space-y-1">
            <p className="text-[10px] text-[#7DD3FC]">{q.prompt}</p>
            <textarea
              rows={2}
              value={answers[i] ?? ''}
              onChange={(e) => {
                const next = [...answers]
                next[i] = e.target.value
                setAnswers(next)
              }}
              className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
            />
          </div>
        ))}
        {submit.error ? <p className="text-[10px] text-red-300">{submit.error.message}</p> : null}
        <Button
          type="button"
          className="system-button w-full text-[10px]"
          disabled={submit.isPending || !displayQuestions.length}
          onClick={() =>
            submit.mutateAsync({ quest: { ...quest, assessment_snapshot: { questions: displayQuestions } }, answers, profile }, { onSuccess: onClose })
          }
        >
          {submit.isPending ? 'GRADING...' : 'Submit assessment'}
        </Button>
      </div>
    </ModalPanel>
  )
}
