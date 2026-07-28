import { NavLink } from 'react-router-dom'
import { Map, MessageSquare, Video, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard/map', icon: Map, label: 'Mapa' },
  { to: '/dashboard/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/dashboard/cameras', icon: Video, label: 'Cámaras' },
  { to: '/dashboard/settings', icon: Settings, label: 'Ajustes' },
] as const

export function BottomNav() {
  return (
    <nav className="flex h-16 items-stretch border-t border-border bg-bg-surface md:hidden">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
              isActive ? 'text-accent-blue' : 'text-text-muted'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`absolute top-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-accent-blue transition-all duration-300 ${
                  isActive ? 'w-10 opacity-100' : 'w-0 opacity-0'
                }`}
              />
              <Icon size={20} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
