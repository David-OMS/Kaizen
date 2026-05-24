import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TREASURY_INCOME_STATUS_OPTIONS } from '@/constants/treasuryOptions'
import { useCreateTreasuryIncome } from '@/hooks/useTreasuryMutations'

const defaultForm = {
  clientId: '',
  amount: '',
  expectedDate: new Date().toISOString().slice(0, 10),
  receivedDate: '',
  status: 'expected',
  description: '',
}

export function IncomeEntryForm({ raidOptions, onSaved }) {
  const createIncome = useCreateTreasuryIncome()
  const [form, setForm] = useState(defaultForm)

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await createIncome.mutateAsync({
      ...form,
      amount: Number(form.amount),
    })
    setForm(defaultForm)
    onSaved?.()
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {createIncome.error ? (
        <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
          <AlertTitle>Failed to add income</AlertTitle>
          <AlertDescription>{createIncome.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="income-raid" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
          Linked Raid
        </Label>
        <select
          id="income-raid"
          value={form.clientId}
          onChange={(event) => handleChange('clientId', event.target.value)}
          className="h-10 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
        >
          <option value="" className="bg-[#12161D]">
            Unlinked
          </option>
          {raidOptions.map((raid) => (
            <option key={raid.id} value={raid.id} className="bg-[#12161D]">
              {raid.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-amount" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
          Amount
        </Label>
        <Input
          id="income-amount"
          type="number"
          min={0}
          required
          value={form.amount}
          onChange={(event) => handleChange('amount', event.target.value)}
          className="h-10 rounded-[2px] border-[#1E2530]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="income-expected-date" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
            Expected Date
          </Label>
          <Input
            id="income-expected-date"
            type="date"
            value={form.expectedDate}
            onChange={(event) => handleChange('expectedDate', event.target.value)}
            className="h-10 rounded-[2px] border-[#1E2530]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="income-received-date" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
            Received Date
          </Label>
          <Input
            id="income-received-date"
            type="date"
            value={form.receivedDate}
            onChange={(event) => handleChange('receivedDate', event.target.value)}
            className="h-10 rounded-[2px] border-[#1E2530]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-status" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
          Status
        </Label>
        <select
          id="income-status"
          value={form.status}
          onChange={(event) => handleChange('status', event.target.value)}
          className="h-10 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
        >
          {TREASURY_INCOME_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status} className="bg-[#12161D]">
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-description" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
          Description
        </Label>
        <textarea
          id="income-description"
          rows={3}
          value={form.description}
          onChange={(event) => handleChange('description', event.target.value)}
          className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
        />
      </div>

      <Button type="submit" className="system-button w-full text-[10px]" disabled={createIncome.isPending}>
        {createIncome.isPending ? 'ADDING...' : 'ADD INCOME ENTRY'}
      </Button>
    </form>
  )
}