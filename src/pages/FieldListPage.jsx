import { useState } from 'react'
import { ClientsSection } from '@/components/field/ClientsSection'
import { FieldSectionTabs } from '@/components/field/FieldSectionTabs'
import { ReachoutsSection } from '@/components/field/ReachoutsSection'

export function FieldListPage() {
  const [activeSection, setActiveSection] = useState('clients')

  return (
    <section className="space-y-4">
      <FieldSectionTabs activeSection={activeSection} onSectionChange={setActiveSection} />
      {activeSection === 'clients' ? <ClientsSection /> : <ReachoutsSection />}
    </section>
  )
}
