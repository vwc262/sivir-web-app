import { useEffect, useMemo, useState } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { SensorList } from '@/components/telemetry/SensorList'
import { ReadingsChart } from '@/components/telemetry/ReadingsChart'
import {
  formatMessageTime,
  sensorTypeLabel,
  useInventario,
  useSensorTelemetria,
  useUltimasLecturas,
  type Lectura,
  type Rango,
  type Resumen,
} from '@/shared'

/** Fecha de hoy en YYYY-MM-DD, que es el formato que espera el core. */
const hoy = () => new Date().toISOString().slice(0, 10)
const haceDias = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

export default function TelemetryPage() {
  const { casas, sensores, casaLabel } = useInventario()
  const { porSensor, loading: cargandoUltimas, error: errorUltimas, refrescar } = useUltimasLecturas()

  const [sensorId, setSensorId] = useState('')
  const [modo, setModo] = useState<'vivo' | 'rango'>('vivo')
  const [desde, setDesde] = useState(haceDias(7))
  const [hasta, setHasta] = useState(hoy())

  // Preseleccionar un sensor en cuanto se conoce el inventario, para que la
  // página no arranque vacía.
  useEffect(() => {
    if (sensores.length === 0) {
      setSensorId('')
      return
    }
    if (!sensores.some((s) => s.id === sensorId)) {
      setSensorId((sensores.find((s) => porSensor.has(s.id)) ?? sensores[0]).id)
    }
  }, [sensores, sensorId, porSensor])

  const rango: Rango = useMemo(
    () => (modo === 'rango' ? { modo: 'rango', desde, hasta } : { modo: 'vivo' }),
    [modo, desde, hasta],
  )

  const { lecturas, resumen, loading, error } = useSensorTelemetria(sensorId, rango)
  const sensor = sensores.find((s) => s.id === sensorId)
  const unidad = lecturas[0]?.unit ?? ''

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Telemetría</h1>
        <button
          onClick={refrescar}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-black/20 px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:text-text-primary cursor-pointer"
        >
          <RefreshCw size={13} className={cargandoUltimas ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {errorUltimas && (
        <p className="rounded-lg border border-accent-red/40 bg-accent-red/10 px-3 py-2 text-xs text-accent-red">
          {errorUltimas}
        </p>
      )}

      {sensores.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-2 p-8 text-center text-text-muted">
          <Activity size={28} />
          <p className="text-sm font-medium">Este condominio no tiene sensores registrados</p>
          <p className="text-xs">Se dan de alta desde el panel de administración.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <SensorList
            casas={casas}
            sensores={sensores}
            ultimaPorSensor={porSensor}
            seleccionado={sensorId}
            onSelect={setSensorId}
          />

          <section className="flex min-w-0 flex-col gap-3">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">{sensor?.ubicacion || sensorId}</h2>
                <p className="text-[11px] text-text-muted">
                  {sensor ? sensorTypeLabel(sensor.sensorType) : ''} · {sensorId}
                </p>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-black/30 p-1">
                {(
                  [
                    { value: 'vivo', label: 'Últimas 24 h' },
                    { value: 'rango', label: 'Histórico' },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setModo(value)}
                    className={`rounded-md px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                      modo === value
                        ? 'bg-accent-blue text-white'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </header>

            {modo === 'rango' && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <label className="flex items-center gap-1.5">
                  Desde
                  <input
                    type="date"
                    value={desde}
                    max={hasta}
                    onChange={(e) => setDesde(e.target.value)}
                    className="rounded-lg border border-border bg-black/30 px-2 py-1 text-text-primary outline-none"
                  />
                </label>
                <label className="flex items-center gap-1.5">
                  Hasta
                  <input
                    type="date"
                    value={hasta}
                    min={desde}
                    max={hoy()}
                    onChange={(e) => setHasta(e.target.value)}
                    className="rounded-lg border border-border bg-black/30 px-2 py-1 text-text-primary outline-none"
                  />
                </label>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-accent-red/40 bg-accent-red/10 px-3 py-2 text-xs text-accent-red">
                {error}
              </p>
            )}

            <ResumenCards resumen={resumen} unidad={unidad} cargando={loading} />

            <div className="glass-card p-3">
              <ReadingsChart lecturas={lecturas} unidad={unidad} />
            </div>

            <LecturasTable lecturas={lecturas} casaLabel={casaLabel} />
          </section>
        </div>
      )}
    </div>
  )
}

function ResumenCards({
  resumen,
  unidad,
  cargando,
}: {
  resumen: Resumen | null
  unidad: string
  cargando: boolean
}) {
  const valor = (v: number | undefined) =>
    v === undefined ? '—' : `${Number(v.toFixed(2))}${unidad ? ` ${unidad}` : ''}`

  const campos = [
    { label: 'Lecturas', value: resumen ? String(resumen.total) : '—' },
    { label: 'Media', value: valor(resumen?.media) },
    { label: 'Máximo', value: valor(resumen?.maximo) },
    { label: 'Mínimo', value: valor(resumen?.minimo) },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {campos.map(({ label, value }) => (
        <div key={label} className="glass-card p-3">
          <p className="text-[11px] text-text-muted">{label}</p>
          <p className={`text-lg font-semibold ${cargando ? 'opacity-50' : ''}`}>{value}</p>
        </div>
      ))}
    </div>
  )
}

/** Últimas lecturas en detalle. Se recorta: la tabla es para inspeccionar, no para exportar. */
function LecturasTable({
  lecturas,
  casaLabel,
}: {
  lecturas: Lectura[]
  casaLabel: (casaId: string) => string
}) {
  const visibles = lecturas.slice(0, 50)
  if (visibles.length === 0) return null

  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border text-text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Momento</th>
            <th className="px-3 py-2 font-medium">Valor</th>
            <th className="px-3 py-2 font-medium">Casa</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((l) => (
            <tr key={l.id} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-1.5">
                {new Date(l.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}{' '}
                {formatMessageTime(l.timestamp)}
              </td>
              <td className="px-3 py-1.5">
                {Number(l.value.toFixed(2))}
                {l.unit && <span className="text-text-muted"> {l.unit}</span>}
              </td>
              <td className="px-3 py-1.5 text-text-muted">
                {l.viviendaId ? casaLabel(l.viviendaId) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {lecturas.length > visibles.length && (
        <p className="px-3 py-2 text-[11px] text-text-muted">
          Mostrando {visibles.length} de {lecturas.length} lecturas.
        </p>
      )}
    </div>
  )
}
