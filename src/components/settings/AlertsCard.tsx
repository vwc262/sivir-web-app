import { useState } from 'react'
import { createPortal } from 'react-dom'
import { BellRing, MapPin, Siren, X } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { type AlertType, TACTICAL_UNITS } from '@/shared'

const PREVIEW_UNIT = TACTICAL_UNITS[0]!

export function AlertsCard() {
  const [alertType, setAlertType] = useState<AlertType>('discreta')
  const [preview, setPreview] = useState<AlertType | null>(null)

  return (
    <Card title="Telemetría y Alertas">
      <div className="space-y-2">
        {(
          [
            { value: 'discreta', label: 'Alerta Discreta', desc: 'Notificación compacta, sin sonido' },
            { value: 'critica', label: 'Alerta Crítica', desc: 'Pantalla completa con máxima prioridad' },
          ] as const
        ).map(({ value, label, desc }) => (
          <label
            key={value}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
              alertType === value
                ? 'border-accent-blue/50 bg-accent-blue/10'
                : 'border-border hover:bg-white/5'
            }`}
          >
            <input
              type="radio"
              name="alert-type"
              value={value}
              checked={alertType === value}
              onChange={() => setAlertType(value)}
              className="mt-1 accent-blue-500"
            />
            <span>
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-text-muted">{desc}</span>
            </span>
          </label>
        ))}
        <Button variant="ghost" className="w-full" onClick={() => setPreview(alertType)}>
          <BellRing size={16} /> Previsualizar
        </Button>
      </div>

      {preview === 'discreta' &&
        createPortal(
        <div className="glass-card fixed top-6 right-6 z-120 flex w-80 max-w-[calc(100vw-3rem)] items-center gap-3 bg-bg-surface/95 p-4 shadow-2xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-amber/15 text-accent-amber">
            <BellRing size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{PREVIEW_UNIT.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-text-muted">
              <MapPin size={12} /> Zona Centro, CDMX
            </p>
          </div>
          <button
            onClick={() => setPreview(null)}
            className="text-text-muted hover:text-text-primary cursor-pointer"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>,
        document.body,
      )}

      {preview === 'critica' &&
        createPortal(
        <div
          className="fixed inset-0 z-120 flex items-center justify-center bg-red-950/70 p-6 backdrop-blur-md"
          onClick={() => setPreview(null)}
        >
          <div
            className="glass-card w-full max-w-md border-accent-red/40 bg-bg-surface/90 p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glow-red mx-auto mb-5 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-accent-red/20 text-accent-red">
              <Siren size={30} />
            </div>
            <h2 className="mb-1 text-xl font-bold text-accent-red">⚠ ALERTA CRÍTICA</h2>
            <p className="mb-6 text-sm text-text-muted">Señal de emergencia recibida</p>
            <div className="mb-6 space-y-2 text-left text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Usuario</span>
                <span className="font-semibold">{PREVIEW_UNIT.name}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Batería</span>
                <span className="font-semibold">{PREVIEW_UNIT.battery}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Ubicación</span>
                <span className="font-semibold">Zona Centro, CDMX</span>
              </div>
            </div>
            <Button variant="danger" className="w-full" onClick={() => setPreview(null)}>
              Atender alerta
            </Button>
          </div>
        </div>,
        document.body,
      )}
    </Card>
  )
}
