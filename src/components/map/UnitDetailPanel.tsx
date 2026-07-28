import { useState } from 'react'
import { X, Phone, Siren, BatteryMedium } from 'lucide-react'
import { useMapStore, type Unit } from '@/shared'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Toast } from '../ui/Toast'

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function BatteryBar({ level }: { level: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <BatteryMedium size={14} /> Batería
        </span>
        <span className="font-semibold text-text-primary">{level}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${level}%`,
            background: 'linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)',
            backgroundSize: `${level > 0 ? 10000 / level : 100}% 100%`,
          }}
        />
      </div>
    </div>
  )
}

export function UnitDetailPanel() {
  const selectedUnit = useMapStore((s) => s.selectedUnit)
  const selectUnit = useMapStore((s) => s.selectUnit)
  const [lastUnit, setLastUnit] = useState<Unit | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  if (selectedUnit && selectedUnit !== lastUnit) setLastUnit(selectedUnit)
  const unit = selectedUnit ?? lastUnit

  return (
    <>
      <aside
        className={`absolute top-0 right-0 z-20 flex h-full w-[320px] max-w-full flex-col gap-5 border-l border-border bg-bg-surface/95 p-5 backdrop-blur-xl transition-transform duration-300 ${
          selectedUnit ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {unit && (
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${
                    unit.isAlerted
                      ? 'bg-accent-red/20 text-accent-red glow-red'
                      : 'bg-accent-blue/20 text-accent-blue glow-blue'
                  }`}
                >
                  {initials(unit.name)}
                </div>
                <div>
                  <h3 className="font-semibold">{unit.name}</h3>
                  <p className="text-xs text-text-muted">Unidad #{unit.id}</p>
                </div>
              </div>
              <button
                onClick={() => selectUnit(null)}
                aria-label="Cerrar panel"
                className="rounded-md p-1 text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="glass-card flex items-center justify-between p-3">
              <div>
                <p className="text-xs text-text-muted">Teléfono</p>
                <p className="text-sm font-medium">{unit.phone}</p>
              </div>
              <button
                onClick={() => setToast(`Llamando a ${unit.name}…`)}
                aria-label="Llamar"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 transition-colors hover:bg-emerald-500/25 cursor-pointer"
              >
                <Phone size={16} />
              </button>
            </div>

            <BatteryBar level={unit.battery} />

            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Estado</span>
              {unit.isAlerted ? (
                <Badge color="red" pulse>● ALERTA ACTIVA</Badge>
              ) : (
                <Badge color="green">● Sin novedades</Badge>
              )}
            </div>

            <div className="mt-auto">
              <Button
                variant="danger"
                className="w-full"
                onClick={() => setToast(`Alerta emitida a ${unit.name}`)}
              >
                <Siren size={16} /> Emitir Alerta
              </Button>
            </div>
          </>
        )}
      </aside>
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  )
}
