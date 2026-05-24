import { Route, Routes } from 'react-router-dom'
import { FieldListPage } from '@/pages/FieldListPage'
import { RaidDetailPage } from '@/pages/RaidDetailPage'

export function FieldPage() {
  return (
    <Routes>
      <Route index element={<FieldListPage />} />
      <Route path="raid/:raidId" element={<RaidDetailPage />} />
    </Routes>
  )
}
