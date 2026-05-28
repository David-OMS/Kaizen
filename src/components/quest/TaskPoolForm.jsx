import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QUEST_KIND } from '@/constants/questLifecycle'
import { useCreateTaskPoolEntry } from '@/hooks/useTaskPoolMutations'

const defaultForm = {
  title: '',
  contextNote: '',
  questKind: QUEST_KIND.LEARNING,
  mandatory: false,
  linkedClientId: '',
}

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
        <Label htmlFor="task-context" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
          Context
        </Label>
        <textarea
          id="task-context"
          rows={3}
          value={form.contextNote}
          onChange={(event) => handleChange('contextNote', event.target.value)}
          placeholder="Why this matters, goals, constraints…"
          className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
        />
      </div>

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

      {form.questKind === QUEST_KIND.EXECUTION && raidOptions?.length ? (
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

      <Button type="submit" className="system-button w-full text-[10px]" disabled={createTask.isPending}>
        {createTask.isPending ? 'Adding…' : 'Add to pool'}
      </Button>
    </form>
  )
}
