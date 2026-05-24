import { useState } from 'react'
import { RaidStreamCard } from '@/components/field/RaidStreamCard'
import { RecurringStreamForm } from '@/components/field/RecurringStreamForm'
import { Button } from '@/components/ui/button'

export function RaidTributeTab({ clientId, streams, accrualsByStream, spoilsHook }) {
  const [showStreamForm, setShowStreamForm] = useState(false)
  const [expandedStreamId, setExpandedStreamId] = useState(null)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          className="system-button text-[10px]"
          onClick={() => setShowStreamForm((v) => !v)}
        >
          {showStreamForm ? 'Close' : 'Add tribute stream'}
        </Button>
      </div>

      {showStreamForm ? (
        <RecurringStreamForm
          clientId={clientId}
          streamMutation={spoilsHook.createStream}
          onClose={() => setShowStreamForm(false)}
        />
      ) : null}

      <div className="space-y-2">
        {streams.map((st) => (
          <RaidStreamCard
            key={st.id}
            stream={st}
            accruals={accrualsByStream[st.id]}
            claimAccrual={spoilsHook.claimAccrual}
            patchStreamAmount={spoilsHook.patchStreamAmount}
            expanded={expandedStreamId === st.id}
            onToggle={() => setExpandedStreamId((id) => (id === st.id ? null : st.id))}
          />
        ))}
      </div>
    </div>
  )
}
