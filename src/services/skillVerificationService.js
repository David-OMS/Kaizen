import { AI_EDGE_FUNCTIONS } from '@/constants/aiAnalysis'
import { supabase } from '@/services/supabase'
import { finalizeArcUnlock } from '@/services/skillArcService'

export async function generateSkillVerificationExam(arcId) {
  const { data, error } = await supabase.functions.invoke(AI_EDGE_FUNCTIONS.SKILL_EXAM_GENERATE, {
    body: { arcId },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  if (!Array.isArray(data?.questions) || !data.questions.length) {
    throw new Error('Exam generation returned no questions.')
  }
  return data
}

export async function gradeSkillExamAndFinalize(arcId, { questions, answers }) {
  const { data, error } = await supabase.functions.invoke(AI_EDGE_FUNCTIONS.SKILL_EXAM_GRADE, {
    body: { arcId, questions, answers },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)

  if (!data.passed) {
    return { score: data.score, passed: false, rationale: data.rationale, finalized: false }
  }

  const arc = await finalizeArcUnlock(arcId)
  return {
    score: data.score,
    passed: true,
    rationale: data.rationale,
    finalized: true,
    arc,
  }
}
