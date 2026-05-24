import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TREASURY_EXPENSE_CATEGORY_OPTIONS } from '@/constants/treasuryOptions'
import { useCreateTreasuryExpense } from '@/hooks/useTreasuryMutations'

const defaultForm = {
  category: 'tools',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  description: '',
}

export function ExpenseEntryForm({ onSaved }) {
  const createExpense = useCreateTreasuryExpense()
  const [form, setForm] = useState(defaultForm)

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await createExpense.mutateAsync({
      ...form,
      amount: Number(form.amount),
    })
    setForm(defaultForm)
    onSaved?.()
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {createExpense.error ? (
        <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
          <AlertTitle>Failed to add expense</AlertTitle>
          <AlertDescription>{createExpense.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="expense-category" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
          Category
        </Label>
        <select
          id="expense-category"
          value={form.category}
          onChange={(event) => handleChange('category', event.target.value)}
          className="h-10 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
        >
          {TREASURY_EXPENSE_CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category} className="bg-[#12161D]">
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="expense-amount" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
            Amount
          </Label>
          <Input
            id="expense-amount"
            type="number"
            min={0}
            required
            value={form.amount}
            onChange={(event) => handleChange('amount', event.target.value)}
            className="h-10 rounded-[2px] border-[#1E2530]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expense-date" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
            Date
          </Label>
          <Input
            id="expense-date"
            type="date"
            value={form.date}
            onChange={(event) => handleChange('date', event.target.value)}
            className="h-10 rounded-[2px] border-[#1E2530]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expense-description" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
          Description
        </Label>
        <textarea
          id="expense-description"
          rows={3}
          value={form.description}
          onChange={(event) => handleChange('description', event.target.value)}
          className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
        />
      </div>

      <Button type="submit" className="system-button w-full text-[10px]" disabled={createExpense.isPending}>
        {createExpense.isPending ? 'ADDING...' : 'ADD EXPENSE ENTRY'}
      </Button>
    </form>
  )
}