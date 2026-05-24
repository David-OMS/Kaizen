import { DailyQuestBriefingGate } from '@/components/quest/DailyQuestBriefingGate'
import { PushNotificationSetup } from '@/components/push/PushNotificationSetup'
import { SurpriseAchievementGate } from '@/components/surprise/SurpriseAchievementGate'
import { AppRouter } from '@/router/AppRouter'

function App() {
  return (
    <>
      <AppRouter />
      <DailyQuestBriefingGate />
      <PushNotificationSetup />
      <SurpriseAchievementGate />
    </>
  )
}

export default App
