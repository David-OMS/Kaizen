import { useState } from 'react'
import { TaskPoolForm } from '@/components/quest/TaskPoolForm'
import { TaskPoolList } from '@/components/quest/TaskPoolList'
import { ModalPanel } from '@/components/ui/ModalPanel'
import { Button } from '@/components/ui/button'

export function TaskPoolSection({ raids }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" className="system-button text-[10px]" onClick={() => setIsModalOpen(true)}>
          Add Task
        </Button>
      </div>
      <TaskPoolList />

      <ModalPanel open={isModalOpen} title="Add Task Pool Entry" onClose={() => setIsModalOpen(false)}>
        <TaskPoolForm raidOptions={raids} onSaved={() => setIsModalOpen(false)} />
      </ModalPanel>
    </section>
  )
}