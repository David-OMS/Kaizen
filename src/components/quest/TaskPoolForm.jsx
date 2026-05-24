import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TASK_POOL_TYPE_OPTIONS } from '@/constants/questOptions'
import { useCreateTaskPoolEntry } from '@/hooks/useTaskPoolMutations'

const defaultForm = {
  title: '',
  contextNote: '',
  type: 'both',
  linkedClientId: '',
  mandatory: false,
  priority: 'normal',
  questKind: '',
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
          Task Title
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
          Context Note
        </Label>
        <textarea
          id="task-context"
          rows={3}
          value={form.contextNote}
          onChange={(event) => handleChange('contextNote', event.target.value)}
          className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="task-type" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
            Type
          </Label>
          <select
            id="task-type"
            value={form.type}
            onChange={(event) => handleChange('type', event.target.value)}
            className="h-10 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
          >
            {TASK_POOL_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type} className="bg-[#12161D]">
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-raid-link" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
            Linked Raid
          </Label>
          <select
            id="task-raid-link"
            value={form.linkedClientId}
            onChange={(event) => handleChange('linkedClientId', event.target.value)}
            className="h-10 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
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
      </div>

      <div className="flex items-center gap-4 text-sm text-zinc-300">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.mandatory}
            onChange={(e) => handleChange('mandatory', e.target.checked)}
          />
          <span className="text-[10px] uppercase tracking-wide">Mandatory</span>
        </label>
        <select
          value={form.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          className="h-8 rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-[10px]"
        >
          <option value="normal">Normal</option>
          <option value="high">High priority</option>
        </select>
        <select
          value={form.questKind}
          onChange={(e) => handleChange('questKind', e.target.value)}
          className="h-8 rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-[10px]"
        >
          <option value="">Auto kind</option>
          <option value="execution">Execution</option>
          <option value="learning">Learning</option>
        </select>
      </div>

      <Button type="submit" className="system-button w-full text-[10px]" disabled={createTask.isPending}>
        {createTask.isPending ? 'ADDING...' : 'ADD TO TASK POOL'}
      </Button>
    </form>
  )
}