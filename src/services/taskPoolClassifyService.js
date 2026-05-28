import { getProfile } from '@/services/profileService'
import { patchTaskPoolEntry } from '@/services/taskPoolService'
import { inferTaskPoolFields } from '@/utils/taskPoolInference'

export async function classifyAndPersistTaskPool(task, input) {
  const profile = await getProfile().catch(() => null)
  const patch = inferTaskPoolFields({
    title: input.title ?? task.title,
    contextNote: input.contextNote ?? task.context_note,
    questKind: input.questKind ?? task.quest_kind,
    mandatory: input.mandatory ?? task.mandatory,
    linkedClientId: input.linkedClientId ?? task.linked_client_id,
    profile,
  })
  await patchTaskPoolEntry(task.id, patch)
  return { ...task, ...patch }
}
