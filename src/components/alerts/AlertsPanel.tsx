import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useAlertsStore, formatMessageTime } from '@/shared'
import type { LiveAlert } from '@/shared'
import { useAlertLabels, type AlertLabels } from './useAlertLabels'

interface AlertsPanelProps {
  open: boolean
  onClose: () => void
}

/** Historial de las alertas recibidas en esta sesión. */
export function AlertsPanel({ open, onClose }: AlertsPanelProps) {
  const alerts = useAlertsStore((s) => s.alerts)
  const markAllRead = useAlertsStore((s) => s.markAllRead)
  const clear = useAlertsStore((s) => s.clear)
  const labelsFor = useAlertLabels()

  // Abrir el panel es haberlas visto: apaga el contador de no leídas.
  useEffect(() => {
    if (open) markAllRead()
  }, [open, markAllRead])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-100 bg-black/40" onClick={onClose} />
      <aside className="fixed top-0 right-0 z-110 flex h-full w-full max-w-sm flex-col border-l border-border bg-bg-surface">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle size={16} className="text-accent-red" />
            Alertas en vivo
          </h2>
          <div className="flex items-center gap-1">
            {alerts.length > 0 && (
              <button
                onClick={clear}
                title="Vaciar la lista"
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {alerts.length === 0 ? (
            <p className="px-2 py-8 text-center text-xs text-text-muted">
              Sin alertas recibidas. Las que lleguen aparecerán aquí en el momento.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {alerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} labels={labelsFor(alert)} />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>,
    document.body,
  )
}

function AlertRow({ alert, labels }: { alert: LiveAlert; labels: AlertLabels }) {
  const critica = alert.severity === 'critical'
  return (
    <li
      className={`glass-card p-3 ${critica ? 'border-accent-red/40' : 'border-accent-amber/40'}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
            critica ? 'bg-accent-red/15 text-accent-red' : 'bg-accent-amber/15 text-accent-amber'
          }`}
        >
          {critica ? 'Crítica' : 'Aviso'}
        </span>
        <span className="text-[11px] text-text-muted">{formatMessageTime(alert.occurredAt)}</span>
      </div>
      <p className="text-sm">{alert.message}</p>
      <p className="mt-1 text-[11px] text-text-muted">
        {labels.sensor}
        {labels.casa && ` · Casa ${labels.casa}`}
      </p>
    </li>
  )
}
