import { supabase } from '@/services/supabase'

const FN = {
  ASSIGN: 'assign-daily-quests',
  JUDGE: 'judge-incomplete-reason',
  EXAM_GEN: 'quest-assessment-generate',
  EXAM_GRADE: 'grade-quest-assessment',
}

export async function invokeAssignDailyQuests(payload) {
  const { data, error } = await supabase.functions.invoke(FN.ASSIGN, { body: payload })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data?.suggestions ?? []
}

export async function invokeJudgeIncompleteReason(payload) {
  const { data, error } = await supabase.functions.invoke(FN.JUDGE, { body: payload })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

export async function invokeQuestAssessmentGenerate(payload) {
  const { data, error } = await supabase.functions.invoke(FN.EXAM_GEN, { body: payload })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

export async function invokeGradeQuestAssessment(payload) {
  const { data, error } = await supabase.functions.invoke(FN.EXAM_GRADE, { body: payload })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}
