import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CLIENT_STATUS_OPTIONS } from '@/constants/fieldOptions'
import { RAID_STATUS_HINTS } from '@/constants/raidStatusLabels'
import { useCreateClient, useUpdateClient } from '@/hooks/useClientMutations'

const defaultForm = {
  name: '',
  projectName: '',
  status: 'pending',
  startDate: '',
  contractValue: '',
  referralSource: '',
  notes: '',
}

export function ClientForm({ editingClient, onEditCancel, onSaved }) {
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()

  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (!editingClient) {
      setForm(defaultForm)
      return
    }

    setForm({
      name: editingClient.name ?? '',
      projectName: editingClient.project_name ?? '',
      status: editingClient.raid_status ?? 'pending',
      startDate: editingClient.start_date ?? '',
      contractValue: editingClient.contract_value ?? '',
      referralSource: editingClient.referral_source ?? '',
      notes: editingClient.notes ?? '',
    })
  }, [editingClient])

  const errorMessage = createClient.error?.message || updateClient.error?.message
  const isSubmitting = createClient.isPending || updateClient.isPending

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const payload = {
      ...form,
      contractValue: form.contractValue ? Number(form.contractValue) : null,
    }

    if (!editingClient) {
      await createClient.mutateAsync(payload)
      setForm(defaultForm)
      onSaved?.()
      return
    }

    await updateClient.mutateAsync({
      ...payload,
      id: editingClient.id,
      previousStatus: editingClient.raid_status,
    })
    onEditCancel()
    onSaved?.()
  }

  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
      <CardHeader className="px-4 pb-2">
        <CardTitle className="text-sm tracking-[0.16em] text-[#7DD3FC] uppercase italic">
          {editingClient ? 'Edit Raid' : 'Start New Raid'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        {errorMessage ? (
          <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
            <AlertTitle>Action failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="client-name" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
              Raid Target
            </Label>
            <Input
              id="client-name"
              required
              value={form.name}
              onChange={(event) => handleChange('name', event.target.value)}
              className="h-10 rounded-[2px] border-[#1E2530]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-name" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
              Raid Objective
            </Label>
            <Input
              id="project-name"
              value={form.projectName}
              onChange={(event) => handleChange('projectName', event.target.value)}
              className="h-10 rounded-[2px] border-[#1E2530]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="client-status" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
                Raid Status
              </Label>
              <select
                id="client-status"
                value={form.status}
                onChange={(event) => handleChange('status', event.target.value)}
                className="h-10 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
              >
                {CLIENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status} className="bg-[#12161D]">
                    {status}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500">{RAID_STATUS_HINTS[form.status]}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-value" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
                Value
              </Label>
              <Input
                id="contract-value"
                type="number"
                min={0}
                value={form.contractValue}
                onChange={(event) => handleChange('contractValue', event.target.value)}
                className="h-10 rounded-[2px] border-[#1E2530]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={form.startDate}
                onChange={(event) => handleChange('startDate', event.target.value)}
                className="h-10 rounded-[2px] border-[#1E2530]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral-source" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
                Source
              </Label>
              <Input
                id="referral-source"
                value={form.referralSource}
                onChange={(event) => handleChange('referralSource', event.target.value)}
                className="h-10 rounded-[2px] border-[#1E2530]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-notes" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
              Raid briefing
            </Label>
            <textarea
              id="client-notes"
              rows={3}
              value={form.notes}
              onChange={(event) => handleChange('notes', event.target.value)}
              placeholder="Modules, roles, integrations, phases — the Analyzer grades project scope from this."
              className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
            />
          </div>

          {!editingClient ? (
            <p className="text-[11px] text-zinc-500">
              Use <span className="text-[#7DD3FC]">pending</span> for agreed clients you have not started yet — begin
              delivery from the raid card later. Use hunts for outreach before commitment.
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button type="submit" className="system-button flex-1 text-[10px]" disabled={isSubmitting}>
              {isSubmitting ? 'SAVING...' : editingClient ? 'UPDATE RAID' : 'START RAID'}
            </Button>
            {editingClient ? (
              <Button type="button" className="system-button text-[10px]" onClick={onEditCancel}>
                CANCEL
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}