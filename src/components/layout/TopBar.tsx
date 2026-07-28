import { useState } from 'react'
import { Bell } from 'lucide-react'
import { AUTH_MODE, useUnreadAlertCount } from '@/shared'
import { AlertsPanel } from '@/components/alerts/AlertsPanel'
import { ConnectionBadge } from '@/components/alerts/ConnectionBadge'
import { CondominioSelector } from './CondominioSelector'

/** Barra de contexto: condominio activo, estado del realtime y alertas. */
export function TopBar() {
  const [panelOpen, setPanelOpen] = useState(false)
  const unread = useUnreadAlertCount()

  return (
    <>
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-bg-surface px-3 py-2">
        <CondominioSelector />
        <ConnectionBadge />

        <div className="flex-1" />

        {AUTH_MODE === 'dev' && (
          <span
            className="hidden rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-2 py-1 text-[10px] font-semibold tracking-wide text-accent-amber uppercase sm:inline"
            title="Autenticación sin Keycloak: solo desarrollo"
          >
            modo dev
          </span>
        )}

        <button
          onClick={() => setPanelOpen(true)}
          aria-label="Alertas"
          className="relative rounded-lg border border-border bg-black/20 p-2 text-text-muted transition-colors hover:text-text-primary cursor-pointer"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
      </header>

      <AlertsPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  )
}
