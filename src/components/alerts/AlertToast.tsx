import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import { useAlertsStore } from '@/shared'
import { useAlertLabels } from './useAlertLabels'

/** Segundos que permanece visible el aviso de una alerta nueva. */
const AUTO_DISMISS_MS = 8_000

/**
 * Aviso emergente de la última alerta recibida. Es la señal inmediata; el
 * historial completo vive en el panel.
 */
export function AlertToast() {
  const alert = useAlertsStore((s) => s.lastAlert)
  const dismiss = useAlertsStore((s) => s.dismissLast)
  const labelsFor = useAlertLabels()

  useEffect(() => {
    if (!alert) return
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [alert, dismiss])

  if (!alert) return null
  const critica = alert.severity === 'critical'
  const { sensor, casa } = labelsFor(alert)

  return createPortal(
    <div
      role="alert"
      className={`glass-card fixed top-4 left-1/2 z-120 w-[min(92vw,26rem)] -translate-x-1/2 bg-bg-surface/95 p-3.5 shadow-xl ${
        critica ? 'border-accent-red/60 glow-red' : 'border-accent-amber/60'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={18}
          className={critica ? 'mt-0.5 text-accent-red' : 'mt-0.5 text-accent-amber'}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{alert.message}</p>
          <p className="mt-0.5 text-xs text-text-muted">
            {sensor}
            {casa && ` · Casa ${casa}`}
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Descartar alerta"
          className="rounded-lg p-1 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>
    </div>,
    document.body,
  )
}
