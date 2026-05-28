import { useEffect, useState } from 'react'
import { ModalPanel } from '@/components/ui/ModalPanel'
import { Button } from '@/components/ui/button'

export function WeeklyFocusSelectionModal({
  open,
  tasks,
  simultaneousLimit,
  onSubmit,
  isSaving,
  errorMessage,
}) {
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (!open) return
    const defaults = (tasks ?? [])
      .filter((t) => t.focus_active !== false)
      .slice(0, simultaneousLimit)
      .map((t) => t.id)
    setSelected(defaults)
  }, [open, tasks, simultaneousLimit])

  const toggle = (taskId) => {
    setSelected((prev) => {
      if (prev.includes(taskId)) return prev.filter((id) => id !== taskId)
      if (prev.length >= simultaneousLimit) return prev
      return [...prev, taskId]
    })
  }

  const canSave = selected.length === simultaneousLimit

  return (
    <ModalPanel open={open} title="Focus weekly tracks" onClose={() => {}}>
      <div className="space-y-3">
        <p className="text-sm text-zinc-300">
          Capacity allows <span className="font-mono text-[#7DD3FC]">{simultaneousLimit}</span> simultaneous
          repeatable weekly tasks. Select exactly that many to keep active.
        </p>
        <div className="space-y-2">
          {(tasks ?? []).map((task) => (
            <label
              key={task.id}
              className="flex items-center justify-between rounded-sm border border-[#1E2530] px-3 py-2 text-sm"
            >
              <span>{task.title}</span>
              <input
                type="checkbox"
                checked={selected.includes(task.id)}
                onChange={() => toggle(task.id)}
              />
            </label>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500">
          Selected {selected.length}/{simultaneousLimit}
        </p>
        {errorMessage ? <p className="text-[11px] text-red-300">{errorMessage}</p> : null}
        <Button
          type="button"
          className="system-button w-full text-[10px]"
          disabled={!canSave || isSaving}
          onClick={() => onSubmit(selected)}
        >
          {isSaving ? 'Saving…' : 'Apply focus selection'}
        </Button>
      </div>
    </ModalPanel>
  )
}
