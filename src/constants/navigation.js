import { Crown, LayoutDashboard, NotebookPen, Radar, Wallet } from 'lucide-react'

export const NAV_ITEMS = [
  { label: 'Profile', path: '/profile', icon: LayoutDashboard },
  { label: 'Field', path: '/field', icon: Radar },
  { label: 'Treasury', path: '/treasury', icon: Wallet },
  { label: 'Quests', path: '/quests', icon: NotebookPen },
  { label: 'Vault', path: '/vault', icon: Crown },
]