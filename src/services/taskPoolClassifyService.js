import { getTaskPool } from '@/services/taskPoolService'
import { inferTaskPoolFields } from '@/utils/taskPoolInference'
import { TASK_SCHEDULE_MODE } from '@/constants/taskPoolSchedule'
import { patchTaskPoolEntry } from '@/services/taskPoolService'
import { decomposeAndPersistProject } from '@/services/taskPoolProjectService'
import { getProfile } from '@/services/profileService'

export async function createAndClassifyTaskPool(payload) {
  const profile = await getProfile().catch(() => null)
  const scheduleMode = payload.scheduleMode || TASK_SCHEDULE_MODE.ONE_SHOT

  const inferred = inferTaskPoolFields({
    title: payload.title,
    contextNote: payload.contextNote,
    questKind: payload.questKind,
    mandatory: payload.mandatory,
    linkedClientId: payload.linkedClientId,
    profile,
    scheduleMode,
    weeklyQuotaTarget: payload.weeklyQuotaTarget,
  })

  const { createTaskPoolEntryRaw } = await import('@/services/taskPoolService')
  const task = await createTaskPoolEntryRaw({
    title: payload.title,
    contextNote: payload.contextNote,
    mandatory: payload.mandatory,
    linkedClientId: payload.linkedClientId,
    questKind: inferred.quest_kind,
    patch: inferred,
  })

  if (scheduleMode === TASK_SCHEDULE_MODE.MULTI_DAY) {
    await decomposeAndPersistProject(task.id, {
      title: payload.title,
      context: payload.contextNote || '',
      questKind: inferred.quest_kind,
    })
    const pool = await getTaskPool()
    return pool.find((t) => t.id === task.id) ?? task
  }

  return { ...task, ...inferred }
}

export async function classifyAndPersistTaskPool(task, input) {
  const profile = await getProfile().catch(() => null)
  const patch = inferTaskPoolFields({
    title: input.title ?? task.title,
    contextNote: input.contextNote ?? task.context_note,
    questKind: input.questKind ?? task.quest_kind,
    mandatory: input.mandatory ?? task.mandatory,
    linkedClientId: input.linkedClientId ?? task.linked_client_id,
    profile,
    scheduleMode: input.scheduleMode,
    weeklyQuotaTarget: input.weeklyQuotaTarget,
  })
  await patchTaskPoolEntry(task.id, patch)
  return { ...task, ...patch }
}
