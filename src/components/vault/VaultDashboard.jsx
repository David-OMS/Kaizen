import { useState } from 'react'
import { AchievementVault } from '@/components/vault/AchievementVault'
import { LockedContentBoard } from '@/components/vault/LockedContentBoard'
import { VaultSectionTabs } from '@/components/vault/VaultSectionTabs'
import { XpLogList } from '@/components/vault/XpLogList'

export function VaultDashboard() {
  const [activeSection, setActiveSection] = useState('xp_log')

  return (
    <section className="space-y-4">
      <VaultSectionTabs activeSection={activeSection} onSectionChange={setActiveSection} />
      {activeSection === 'xp_log' ? <XpLogList /> : null}
      {activeSection === 'achievements' ? <AchievementVault /> : null}
      {activeSection === 'locked_content' ? <LockedContentBoard /> : null}
    </section>
  )
}