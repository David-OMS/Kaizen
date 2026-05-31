import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TaskPoolCompletedSection({ tasks }) {
  const [open, setOpen] = useState(false)

  if (!tasks.length) return null

  return (
    <section className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        className="flex h-auto w-full items-center justify-between rounded-sm border border-zinc-800 bg-[#12161D]/60 px-4 py-3 text-left hover:bg-[#12161D]"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-[10px] tracking-[0.14em] text-zinc-400 uppercase">
          Completed ({tasks.length})
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </Button>
      {open ? (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="rounded-sm border border-zinc-800 bg-[#12161D]/50 py-3 opacity-90"
            >
              <CardHeader className="px-4 pb-1">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-sm tracking-[0.1em] text-zinc-400 uppercase italic line-through">
                    {task.title}
                  </CardTitle>
                  <span className="text-[10px] text-zinc-600 uppercase">Done</span>
                </div>
              </CardHeader>
              <CardContent className="px-4 text-[11px] text-zinc-600">
                {task.context_note || 'No context'}
                {Number(task.times_assigned || 0) > 0 ? ` · assigned ${task.times_assigned}×` : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  )
}
