import { NavLink, useNavigate } from 'react-router-dom'
import { Map, MessageSquare, Video, Settings, LogOut, UserCircle2 } from 'lucide-react'
import { useAuthStore, useSession, useUnreadAlertCount } from '@/shared'

const NAV_ITEMS = [
  { to: '/dashboard/map', icon: Map, label: 'Mapa' },
  { to: '/dashboard/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/dashboard/cameras', icon: Video, label: 'Cámaras' },
  { to: '/dashboard/settings', icon: Settings, label: 'Configuración' },
] as const

export function Sidebar() {
  const session = useSession()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  // Alertas reales del hub, no datos de ejemplo.
  const alertCount = useUnreadAlertCount()
  const user = session?.username ?? ''

  return (
    <aside className="hidden h-full w-[72px] flex-col items-center border-r border-border bg-bg-surface py-4 md:flex">
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue font-bold text-sm glow-blue">
        SV
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group/nav relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                isActive
                  ? 'bg-accent-blue/15 text-accent-blue'
                  : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
              }`
            }
          >
            <Icon size={20} />
            {label === 'Mapa' && alertCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-white">
                {alertCount}
              </span>
            )}
            <span className="nav-tooltip">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-2">
        <div
          className="group/nav relative flex h-11 w-11 items-center justify-center rounded-xl text-text-muted"
          title={user ?? ''}
        >
          <UserCircle2 size={22} />
          <span className="nav-tooltip">{user}</span>
        </div>
        <button
          onClick={() => {
            void logout().then(() => navigate('/', { replace: true }))
          }}
          className="group/nav relative flex h-11 w-11 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-accent-red/15 hover:text-accent-red cursor-pointer"
        >
          <LogOut size={20} />
          <span className="nav-tooltip">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
