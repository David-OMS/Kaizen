import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConvertHuntToRaid } from '@/hooks/useReachoutMutations'

export function ConvertHuntToRaidForm({ hunt, onSaved }) {
  const convertHunt = useConvertHuntToRaid()
  const [projectName, setProjectName] = useState(hunt.company ?? '')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [contractValue, setContractValue] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    await convertHunt.mutateAsync({
      hunt,
      projectName,
      startDate,
      contractValue: contractValue ? Number(contractValue) : null,
      notes,
    })
    onSaved()
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {convertHunt.error ? (
        <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
          <AlertTitle>Conversion failed</AlertTitle>
          <AlertDescription>{convertHunt.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label className="tracking-[0.1em] text-[#7DD3FC] uppercase">Hunt Target</Label>
        <Input value={hunt.contact_name} disabled className="h-10 rounded-[2px] border-[#1E2530]" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="raid-project" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
          Raid Objective
        </Label>
        <Input
          id="raid-project"
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          className="h-10 rounded-[2px] border-[#1E2530]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="raid-start-date" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
          Start Date
        </Label>
        <Input
          id="raid-start-date"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="h-10 rounded-[2px] border-[#1E2530]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="raid-contract" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
          Value (optional)
        </Label>
        <Input
          id="raid-contract"
          type="number"
          min={0}
          value={contractValue}
          onChange={(event) => setContractValue(event.target.value)}
          className="h-10 rounded-[2px] border-[#1E2530]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="raid-notes" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
          Raid briefing
        </Label>
        <textarea
          id="raid-notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="List real requirements: modules (sales, inventory…), users/roles, integrations, phases, forks — AI grades from this, not from fear."
          className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
        />
      </div>

      <p className="text-[11px] text-zinc-500">
        Converts as an <span className="text-[#7DD3FC]">ongoing</span> raid — the hunt succeeded, so this is active
        client work. Leave value empty for phased deals.
      </p>

      <Button type="submit" className="system-button w-full text-[10px]" disabled={convertHunt.isPending}>
        {convertHunt.isPending ? 'SYSTEM ANALYZING RAID…' : 'CREATE RAID FROM HUNT'}
      </Button>
    </form>
  )
}
