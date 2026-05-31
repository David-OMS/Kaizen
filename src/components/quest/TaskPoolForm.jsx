import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QUEST_KIND } from '@/constants/questLifecycle'
import { TASK_SCHEDULE_MODE } from '@/constants/taskPoolSchedule'
import { useCreateTaskPoolEntry } from '@/hooks/useTaskPoolMutations'

const defaultForm = {
  title: '',
  contextNote: '',
  questKind: QUEST_KIND.EXECUTION,
  mandatory: false,
  linkedClientId: '',
  scheduleMode: TASK_SCHEDULE_MODE.ONE_SHOT,
  weeklyQuotaTarget: 2,
}

const SCHEDULE_OPTIONS = [
  { value: TASK_SCHEDULE_MODE.ONE_SHOT, label: 'One day' },
  { value: TASK_SCHEDULE_MODE.MULTI_DAY, label: 'Multi-day project' },
  { value: TASK_SCHEDULE_MODE.WEEKLY_QUOTA, label: 'Weekly quota' },
]

export function TaskPoolForm({ raidOptions, onSaved }) {
  const createTask = useCreateTaskPoolEntry()
  const [form, setForm] = useState(defaultForm)

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await createTask.mutateAsync(form)
    setForm(defaultForm)
    onSaved?.()
  }

  const isMultiDay = form.scheduleMode === TASK_SCHEDULE_MODE.MULTI_DAY
  const isWeeklyQuota = form.scheduleMode === TASK_SCHEDULE_MODE.WEEKLY_QUOTA
  const isPending = createTask.isPending
  const pendingLabel = isMultiDay && isPending ? 'Planning phases…' : isPending ? 'Adding…' : 'Add to pool'

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {createTask.error ? (
        <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
          <AlertTitle>Failed to add task</AlertTitle>
          <AlertDescription>{createTask.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="task-title" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
          Title
        </Label>
        <Input
          id="task-title"
          required
          value={form.title}
          onChange={(event) => handleChange('title', event.target.value)}
          className="h-10 rounded-[2px] border-[#1E2530]"
        />
      </div>

      <div className="space-y-2">
        <Label className="tracking-[0.1em] text-[#7DD3FC] uppercase">Schedule</Label>
        <div className="flex flex-wrap gap-1 rounded-sm border border-[#1E2530] p-0.5">
          {SCHEDULE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`px-2 py-1.5 text-[10px] uppercase tracking-wide ${
                form.scheduleMode === option.value ? 'bg-[#7DD3FC]/20 text-[#7DD3FC]' : 'text-zinc-500'
              }`}
              onClick={() => handleChange('scheduleMode', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-context" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
          Context
        </Label>
        <textarea
          id="task-context"
          rows={isMultiDay ? 5 : 3}
          value={form.contextNote}
          onChange={(event) => handleChange('contextNote', event.target.value)}
          placeholder={
            isMultiDay
              ? 'Dump everything — features, constraints, deliverables. AI splits this into daily phases.'
              : isWeeklyQuota
                ? 'What counts as one unit toward the quota (e.g. one outreach, one hunt).'
                : 'Why this matters, goals, constraints…'
          }
          className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
        />
      </div>

      {isWeeklyQuota ? (
        <div className="space-y-2">
          <Label htmlFor="weekly-quota" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
            Per week
          </Label>
          <Input
            id="weekly-quota"
            type="number"
            min={1}
            max={14}
            value={form.weeklyQuotaTarget}
            onChange={(event) => handleChange('weeklyQuotaTarget', Number(event.target.value) || 1)}
            className="h-10 w-24 rounded-[2px] border-[#1E2530]"
          />
        </div>
      ) : null}

      {!isWeeklyQuota ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
          <div className="flex rounded-sm border border-[#1E2530] p-0.5">
            <button
              type="button"
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wide ${
                form.questKind === QUEST_KIND.LEARNING ? 'bg-[#7DD3FC]/20 text-[#7DD3FC]' : 'text-zinc-500'
              }`}
              onClick={() => handleChange('questKind', QUEST_KIND.LEARNING)}
            >
              Learning
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wide ${
                form.questKind === QUEST_KIND.EXECUTION ? 'bg-[#7DD3FC]/20 text-[#7DD3FC]' : 'text-zinc-500'
              }`}
              onClick={() => handleChange('questKind', QUEST_KIND.EXECUTION)}
            >
              Execution
            </button>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.mandatory}
              onChange={(e) => handleChange('mandatory', e.target.checked)}
            />
            <span className="text-[10px] uppercase tracking-wide">Must not skip</span>
          </label>
        </div>
      ) : (
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">
          Assigned daily until quota met · resets Monday
        </p>
      )}

      {form.questKind === QUEST_KIND.EXECUTION && !isWeeklyQuota && raidOptions?.length ? (
        <div className="space-y-1">
          <Label htmlFor="task-raid-link" className="text-[10px] uppercase text-zinc-400">
            Linked raid (optional)
          </Label>
          <select
            id="task-raid-link"
            value={form.linkedClientId}
            onChange={(event) => handleChange('linkedClientId', event.target.value)}
            className="h-9 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
          >
            <option value="" className="bg-[#12161D]">
              None
            </option>
            {raidOptions.map((raid) => (
              <option key={raid.id} value={raid.id} className="bg-[#12161D]">
                {raid.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <Button type="submit" className="system-button w-full text-[10px]" disabled={isPending}>
        {pendingLabel}
      </Button>
    </form>
  )
}
