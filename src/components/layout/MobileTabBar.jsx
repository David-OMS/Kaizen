import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/constants/navigation'
import { cn } from '@/lib/utils'

export function MobileTabBar() {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-[#1E2530] bg-[#12161D]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5 gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'system-button flex flex-col items-center gap-1 px-2 py-2 text-[10px] leading-none',
                    isActive && 'border-[#7DD3FC] text-[#7DD3FC] shadow-[0_0_15px_rgba(125,211,252,0.35)]',
                  )
                }
              >
                <Icon className="size-4" strokeWidth={1.8} />
                <span className="tracking-[0.08em] uppercase">{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}