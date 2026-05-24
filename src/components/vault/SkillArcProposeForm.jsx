import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateSkillArc } from '@/hooks/useSkillArcMutations'

export function SkillArcProposeForm() {
  const createArc = useCreateSkillArc()
  const [name, setName] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!name.trim()) return
    await createArc.mutateAsync({ proposedSkillName: name.trim(), skillId: null, metadata: {} })
    setName('')
  }

  return (
    <form className="space-y-2 rounded-sm border border-[#1E2530] bg-[#080A0F]/60 p-3" onSubmit={handleSubmit}>
      <Label htmlFor="arc-name" className="text-[10px] tracking-[0.12em] text-[#7DD3FC] uppercase">
        Propose domain arc
      </Label>
      <Input
        id="arc-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. PostgreSQL indexing"
        className="h-9 rounded-[2px] border-[#1E2530] text-sm"
      />
      <Button type="submit" className="system-button w-full text-[10px]" disabled={createArc.isPending}>
        {createArc.isPending ? 'SUBMITTING...' : 'Submit proposal'}
      </Button>
      {createArc.error ? (
        <p className="text-[10px] text-red-300">{createArc.error.message}</p>
      ) : null}
    </form>
  )
}
