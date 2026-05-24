import { ARC_QUEST_META } from '@/constants/skillArcMetadata'
import { getQuestsByIds } from '@/services/questService'
import { getSkillArcs, updateSkillArcStatus } from '@/services/skillArcService'

/** When a linked quest completes, move arc to verification if weekly + all dailies are done. */
export async function processSkillArcsAfterQuestCompleted(completedQuest) {
  if (!completedQuest?.id || completedQuest.status !== 'completed') return

  const arcs = await getSkillArcs()
  const activeArcs = arcs.filter((a) => a.status === 'active')

  for (const arc of activeArcs) {
    const meta = arc.metadata || {}
    const wid = meta[ARC_QUEST_META.WEEKLY]
    const dailies = meta[ARC_QUEST_META.DAILIES] || []
    const linked = [wid, ...dailies].filter(Boolean)
    if (!linked.length || !linked.includes(completedQuest.id)) continue

    const rows = await getQuestsByIds(linked)
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]))
    const allDone = linked.every((id) => byId[id]?.status === 'completed')
    if (allDone) {
      await updateSkillArcStatus(arc.id, 'verification')
    }
  }
}
