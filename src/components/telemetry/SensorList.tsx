import { Home, Radio } from 'lucide-react'
import { formatMessageTime, sensorTypeLabel, type Casa, type Lectura, type Sensor } from '@/shared'

interface SensorListProps {
  casas: Casa[]
  sensores: Sensor[]
  ultimaPorSensor: Map<string, Lectura>
  seleccionado: string
  onSelect: (sensorId: string) => void
}

/** Sensores del condominio agrupados por la casa donde están instalados. */
export function SensorList({
  casas,
  sensores,
  ultimaPorSensor,
  seleccionado,
  onSelect,
}: SensorListProps) {
  const grupos = casas
    .map((casa) => ({ casa, sensores: sensores.filter((s) => s.casaId === casa.id) }))
    .filter((g) => g.sensores.length > 0)

  return (
    <div className="flex flex-col gap-4">
      {grupos.map(({ casa, sensores: delCasa }) => (
        <section key={casa.id}>
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-text-muted uppercase">
            <Home size={13} />
            Casa {casa.identificador}
          </h2>
          <ul className="flex flex-col gap-2">
            {delCasa.map((sensor) => (
              <SensorRow
                key={sensor.id}
                sensor={sensor}
                ultima={ultimaPorSensor.get(sensor.id)}
                activo={sensor.id === seleccionado}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

interface SensorRowProps {
  sensor: Sensor
  ultima?: Lectura
  activo: boolean
  onSelect: (sensorId: string) => void
}

function SensorRow({ sensor, ultima, activo, onSelect }: SensorRowProps) {
  return (
    <li>
      <button
        onClick={() => onSelect(sensor.id)}
        className={`glass-card flex w-full items-center gap-3 p-3 text-left transition-colors cursor-pointer hover:bg-white/5 ${
          activo ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        <Radio
          size={16}
          className={sensor.enabled ? 'shrink-0 text-accent-blue' : 'shrink-0 text-text-muted/50'}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{sensor.ubicacion || sensor.id}</p>
          <p className="text-[11px] text-text-muted">
            {sensorTypeLabel(sensor.sensorType)}
            {!sensor.enabled && ' · deshabilitado'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {ultima ? (
            <>
              <p className="text-sm font-medium">
                {Number(ultima.value.toFixed(2))}
                {ultima.unit && <span className="text-xs text-text-muted"> {ultima.unit}</span>}
              </p>
              <p className="text-[11px] text-text-muted">{formatMessageTime(ultima.timestamp)}</p>
            </>
          ) : (
            // Sin lectura reciente no se puede afirmar que el sensor esté mal:
            // la tabla viva solo guarda 24 h.
            <p className="text-[11px] text-text-muted">sin lecturas 24 h</p>
          )}
        </div>
      </button>
    </li>
  )
}
