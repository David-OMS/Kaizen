import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  HUNT_FEAR_DEFAULT,
  HUNT_FEAR_OPTIONS,
  REACHOUT_CHANNEL_OPTIONS,
} from '@/constants/fieldOptions'
import { useCreateReachout } from '@/hooks/useReachoutMutations'

const defaultForm = {
  contactName: '',
  company: '',
  channel: 'whatsapp',
  dateSent: new Date().toISOString().slice(0, 10),
  fearLevel: String(HUNT_FEAR_DEFAULT),
  notes: '',
}

export function ReachoutForm({ onSaved }) {
  const createReachout = useCreateReachout()
  const [form, setForm] = useState(defaultForm)

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const result = await createReachout.mutateAsync({
      ...form,
      fearLevel: Number(form.fearLevel),
    })
    setForm(defaultForm)
    onSaved?.(result)
  }

  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
      <CardHeader className="px-4 pb-2">
        <CardTitle className="text-sm tracking-[0.16em] text-[#7DD3FC] uppercase italic">Start New Hunt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        {createReachout.error ? (
          <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
            <AlertTitle>Hunt failed to register</AlertTitle>
            <AlertDescription>{createReachout.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="contact-name" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
              Target
            </Label>
            <Input
              id="contact-name"
              required
              value={form.contactName}
              onChange={(event) => handleChange('contactName', event.target.value)}
              className="h-10 rounded-[2px] border-[#1E2530]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-name" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
              Organization
            </Label>
            <Input
              id="company-name"
              value={form.company}
              onChange={(event) => handleChange('company', event.target.value)}
              className="h-10 rounded-[2px] border-[#1E2530]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="reachout-channel" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
                Channel
              </Label>
              <select
                id="reachout-channel"
                value={form.channel}
                onChange={(event) => handleChange('channel', event.target.value)}
                className="h-10 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
              >
                {REACHOUT_CHANNEL_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-[#12161D]">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-sent" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
                Hunt date
              </Label>
              <Input
                id="date-sent"
                type="date"
                required
                value={form.dateSent}
                onChange={(event) => handleChange('dateSent', event.target.value)}
                className="h-10 rounded-[2px] border-[#1E2530]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fear-level" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
              Fear level (hunt only)
            </Label>
            <select
              id="fear-level"
              value={form.fearLevel}
              onChange={(event) => handleChange('fearLevel', event.target.value)}
              className="h-10 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
            >
              {HUNT_FEAR_OPTIONS.map((level) => (
                <option key={level} value={String(level)} className="bg-[#12161D]">
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reachout-notes" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
              Hunt log
            </Label>
            <textarea
              id="reachout-notes"
              rows={3}
              value={form.notes}
              onChange={(event) => handleChange('notes', event.target.value)}
              className="w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 py-2 text-sm"
              placeholder="Your pitch and context at send time…"
            />
          </div>

          <p className="text-[11px] text-zinc-500">
            Fear is your outreach nerves — hunts only. Raids use AI project difficulty, not fear.
            Outcome is set later.
          </p>

          <Button type="submit" className="system-button w-full text-[10px]" disabled={createReachout.isPending}>
            {createReachout.isPending ? 'LAUNCHING…' : 'START HUNT'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
