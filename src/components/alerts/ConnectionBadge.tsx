import { useAlertsStore } from '@/shared'
import type { ConnectionStatus } from '@/shared'

const LABELS: Record<ConnectionStatus, string> = {
  idle: 'Sin condominio',
  connecting: 'Conectando…',
  online: 'En vivo',
  offline: 'Sin conexión',
}

const COLORS: Record<ConnectionStatus, string> = {
  idle: 'bg-text-muted',
  connecting: 'bg-accent-amber',
  online: 'bg-emerald-400',
  offline: 'bg-accent-red',
}

/** Estado de la conexión con el hub de alertas. */
export function ConnectionBadge() {
  const status = useAlertsStore((s) => s.status)

  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-border bg-black/20 px-2.5 py-1.5 text-xs text-text-muted"
      title={`Alertas en vivo: ${LABELS[status]}`}
    >
      <span className="relative flex h-2 w-2">
        {status === 'online' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span className={`inline-flex h-2 w-2 rounded-full ${COLORS[status]}`} />
      </span>
      <span className="hidden sm:inline">{LABELS[status]}</span>
    </div>
  )
}
