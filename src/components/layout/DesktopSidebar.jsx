import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/constants/navigation'
import { cn } from '@/lib/utils'

export function DesktopSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-[#1E2530] bg-[#12161D]/95 p-4 md:block">
      <div className="mb-6 rounded-sm border border-[#1E2530] bg-[#080A0F] p-4">
        <p className="text-xs tracking-[0.15em] text-[#A855F7] uppercase">System Node</p>
        <p className="mt-2 text-xl font-black tracking-[0.12em] text-[#7DD3FC] uppercase italic">OMS</p>
      </div>

      <nav>
        <ul className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'system-button flex items-center gap-3 px-3 py-3',
                      isActive && 'border-[#7DD3FC] text-[#7DD3FC] shadow-[0_0_15px_rgba(125,211,252,0.35)]',
                    )
                  }
                >
                  <Icon className="size-4" strokeWidth={1.8} />
                  <span className="text-xs tracking-[0.15em] uppercase">{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}