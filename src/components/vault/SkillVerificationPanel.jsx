import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { SKILL_VERIFICATION_PASS_THRESHOLD } from '@/constants/skillVerification'
import { useFinalizeArcUnlock } from '@/hooks/useSkillArcMutations'
import { useGenerateSkillExam } from '@/hooks/useGenerateSkillExam'
import { useSubmitSkillVerification } from '@/hooks/useSubmitSkillVerification'
import { hasPassedVerificationForArc } from '@/services/skillVerificationGradeService'

export function SkillVerificationPanel({ arc }) {
  const generate = useGenerateSkillExam()
  const submit = useSubmitSkillVerification()
  const finalizeUnlock = useFinalizeArcUnlock()
  const [questions, setQuestions] = useState(null)
  const [answers, setAnswers] = useState({})
  const [lastResult, setLastResult] = useState(null)

  const passQuery = useQuery({
    queryKey: QUERY_KEYS.skillVerificationPass(arc.id),
    queryFn: () => hasPassedVerificationForArc(arc.id),
    enabled: arc.status === 'verification',
  })

  useEffect(() => {
    setQuestions(null)
    setAnswers({})
    setLastResult(null)
  }, [arc.id])

  const handleGenerate = async () => {
    const res = await generate.mutateAsync(arc.id)
    setQuestions(res.questions)
    const next = {}
    res.questions.forEach((q) => {
      next[q.id] = ''
    })
    setAnswers(next)
    setLastResult(null)
  }

  const handleSubmit = async () => {
    if (!questions?.length) return
    const ordered = questions.map((q) => answers[q.id] ?? '')
    const result = await submit.mutateAsync({ arcId: arc.id, questions, answers: ordered })
    setLastResult(result)
    if (result.finalized) {
      setQuestions(null)
      setAnswers({})
    }
  }

  return (
    <div className="space-y-3 border-t border-[#1E2530] pt-3">
      <p className="text-[10px] leading-relaxed text-zinc-500">
        Phase 7: short written exam (score ≥ {SKILL_VERIFICATION_PASS_THRESHOLD} unlocks the skill). Failed attempts
        keep your arc in verification — retry anytime.
      </p>

      {passQuery.isLoading ? <p className="text-[10px] text-zinc-500">Checking prior attempts…</p> : null}
      {passQuery.isError ? (
        <p className="text-[10px] text-red-300">{passQuery.error.message}</p>
      ) : null}
      {passQuery.data === true ? (
        <div className="space-y-2 rounded-sm border border-emerald-900/40 bg-emerald-950/20 p-2">
          <p className="text-[10px] text-emerald-200/90">Exam threshold met. Finish unlock if the app did not advance automatically.</p>
          <Button
            type="button"
            className="system-button text-[10px]"
            disabled={finalizeUnlock.isPending}
            onClick={() => finalizeUnlock.mutateAsync(arc.id).catch(() => undefined)}
          >
            {finalizeUnlock.isPending ? 'Unlocking…' : 'Complete unlock'}
          </Button>
          {finalizeUnlock.error ? (
            <p className="text-[10px] text-red-300">{finalizeUnlock.error.message}</p>
          ) : null}
        </div>
      ) : null}

      {!questions?.length ? (
        <Button
          type="button"
          className="system-button text-[10px]"
          disabled={generate.isPending}
          onClick={() => handleGenerate().catch(() => undefined)}
        >
          {generate.isPending ? 'Generating…' : 'Generate exam'}
        </Button>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="space-y-1">
              <p className="text-[10px] text-zinc-300">{q.prompt}</p>
              <textarea
                name={`answer-${q.id}`}
                rows={3}
                className="w-full rounded-sm border border-[#1E2530] bg-[#0B0E12] px-2 py-1.5 text-[11px] text-zinc-200 outline-none focus-visible:border-[#7DD3FC]/50"
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              />
            </div>
          ))}
          <Button
            type="button"
            className="system-button text-[10px]"
            disabled={submit.isPending}
            onClick={() => handleSubmit().catch(() => undefined)}
          >
            {submit.isPending ? 'Submitting…' : 'Submit answers'}
          </Button>
        </div>
      )}

      {lastResult && !lastResult.finalized ? (
        <p className="text-[10px] text-[#7DD3FC]/90">
          Score {lastResult.score}. {lastResult.rationale || 'Below threshold — adjust answers and submit again.'}
        </p>
      ) : null}
      {lastResult?.finalized ? (
        <p className="text-[10px] text-emerald-300/90">Verification passed. Skill unlocked.</p>
      ) : null}
      {generate.error ? <p className="text-[10px] text-red-300">{generate.error.message}</p> : null}
      {submit.error ? <p className="text-[10px] text-red-300">{submit.error.message}</p> : null}
    </div>
  )
}
