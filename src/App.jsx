import { DailyBrainTeaserGate } from '@/components/home/DailyBrainTeaserGate'
import { DailyQuestBriefingGate } from '@/components/quest/DailyQuestBriefingGate'
import { PushNotificationSetup } from '@/components/push/PushNotificationSetup'
import { PwaUpdatePrompt } from '@/components/pwa/PwaUpdatePrompt'
import { SurpriseAchievementGate } from '@/components/surprise/SurpriseAchievementGate'
import { AppRouter } from '@/router/AppRouter'

function App() {
  return (
    <>
      <AppRouter />
      <PwaUpdatePrompt />
      <DailyBrainTeaserGate />
      <DailyQuestBriefingGate />
      <PushNotificationSetup />
      <SurpriseAchievementGate />
    </>
  )
}

export default App
