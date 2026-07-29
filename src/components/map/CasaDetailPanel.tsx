import { X, Radio, Video, Users, Smartphone, AlertTriangle, MapPinOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  formatMessageTime,
  sensorTypeLabel,
  useAlertsStore,
  useCamaras,
  useDevicesStore,
  useInventario,
  useMapStore,
  useResidentes,
  useUltimasLecturas,
} from '@/shared'
import { Badge } from '../ui/Badge'

/**
 * Detalle de la casa seleccionada en el mapa: su equipamiento y quién vive en
 * ella. Es el segundo nivel de la jerarquía condominio → casa → equipos.
 */
export function CasaDetailPanel() {
  const casaId = useMapStore((s) => s.selectedCasaId)
  const selectCasa = useMapStore((s) => s.selectCasa)

  const { casas, sensores } = useInventario()
  const { camaras } = useCamaras()
  const { porSensor } = useUltimasLecturas()
  const { residentesDe } = useResidentes()
  const alertas = useAlertsStore((s) => s.alerts)
  const estadoPorDispositivo = useDevicesStore((s) => s.porDispositivo)

  const casa = casas.find((c) => c.id === casaId)
  const abierto = Boolean(casa)

  const sensoresDeCasa = sensores.filter((s) => s.casaId === casaId)
  const camarasDeCasa = camaras.filter((c) => c.casaId === casaId)
  const residentes = casaId ? residentesDe(casaId) : []
  const alertasDeCasa = alertas.filter((a) => a.casaId === casaId)

  return (
    <aside
      className={`absolute top-0 right-0 z-20 flex h-full w-[340px] max-w-full flex-col gap-4 overflow-y-auto border-l border-border bg-bg-surface/95 p-5 backdrop-blur-xl transition-transform duration-300 ${
        abierto ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {casa && (
        <>
          <header className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">Casa {casa.identificador}</h3>
              <p className="text-xs text-text-muted">{casa.id}</p>
            </div>
            <button
              onClick={() => selectCasa(null)}
              aria-label="Cerrar panel"
              className="rounded-md p-1 text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary cursor-pointer"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Estado</span>
            {alertasDeCasa.length > 0 ? (
              <Badge color="red" pulse>
                ● {alertasDeCasa.length} ALERTA{alertasDeCasa.length > 1 ? 'S' : ''}
              </Badge>
            ) : (
              <Badge color="green">● Sin novedades</Badge>
            )}
          </div>

          {alertasDeCasa.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {alertasDeCasa.slice(0, 3).map((alerta) => (
                <li
                  key={alerta.id}
                  className="glass-card flex items-start gap-2 border-accent-red/40 p-2.5 text-xs"
                >
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-accent-red" />
                  <div className="min-w-0">
                    <p className="truncate">{alerta.message}</p>
                    <p className="text-[11px] text-text-muted">
                      {formatMessageTime(alerta.occurredAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Seccion icon={<Radio size={13} />} titulo="Sensores" total={sensoresDeCasa.length}>
            {sensoresDeCasa.map((sensor) => {
              const ultima = porSensor.get(sensor.id)
              return (
                <li key={sensor.id} className="flex items-center justify-between gap-2 py-1.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs">{sensor.ubicacion || sensor.id}</p>
                    <p className="text-[11px] text-text-muted">
                      {sensorTypeLabel(sensor.sensorType)}
                      {!sensor.enabled && ' · deshabilitado'}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs">
                    {ultima ? (
                      <>
                        {Number(ultima.value.toFixed(2))}
                        {ultima.unit && <span className="text-text-muted"> {ultima.unit}</span>}
                      </>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </p>
                </li>
              )
            })}
          </Seccion>

          <Seccion icon={<Video size={13} />} titulo="Cámaras" total={camarasDeCasa.length}>
            {camarasDeCasa.map((camara) => (
              <li key={camara.id} className="flex items-center justify-between gap-2 py-1.5">
                <p className="min-w-0 truncate text-xs">{camara.nombre}</p>
                <span
                  className={`shrink-0 text-[11px] ${camara.enabled ? 'text-emerald-400' : 'text-text-muted'}`}
                >
                  {camara.enabled ? 'activa' : 'inactiva'}
                </span>
              </li>
            ))}
          </Seccion>

          <Seccion icon={<Users size={13} />} titulo="Residentes" total={residentes.length}>
            {residentes.map((residente) => (
              <li key={residente.userId} className="py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-xs">{residente.nombre}</p>
                  <span className="shrink-0 text-[11px] text-text-muted">{residente.rol}</span>
                </div>
                {/* Los dispositivos cuelgan del usuario, no de la casa: un
                    residente puede tener varios y se listan bajo su nombre. */}
                {residente.dispositivos.length > 0 && (
                  <ul className="mt-1 flex flex-col gap-0.5 pl-3">
                    {residente.dispositivos.map((dispositivo) => {
                      // El estado en vivo manda sobre el alta: un dispositivo
                      // habilitado que no reporta no está "activo".
                      const estado = estadoPorDispositivo[dispositivo.id]
                      return (
                        <li
                          key={dispositivo.id}
                          className="flex items-center gap-1.5 text-[11px] text-text-muted"
                        >
                          <Smartphone
                            size={11}
                            className={estado?.online ? 'shrink-0 text-emerald-400' : 'shrink-0'}
                          />
                          <span className="min-w-0 truncate">{dispositivo.alias}</span>
                          {estado ? (
                            <span className="shrink-0">
                              · {estado.battery}%{' '}
                              {estado.online
                                ? `· ${formatMessageTime(estado.updated_at)}`
                                : '· sin señal'}
                            </span>
                          ) : (
                            <span className="shrink-0">· {dispositivo.plataforma}</span>
                          )}
                          {!dispositivo.enabled && <span className="shrink-0">· dado de baja</span>}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            ))}
          </Seccion>

          <div className="mt-auto flex gap-2 pt-2">
            <Link
              to="/dashboard/telemetry"
              className="flex-1 rounded-lg border border-border bg-black/20 py-2 text-center text-xs transition-colors hover:bg-white/5"
            >
              Telemetría
            </Link>
            <Link
              to="/dashboard/cameras"
              className="flex-1 rounded-lg border border-border bg-black/20 py-2 text-center text-xs transition-colors hover:bg-white/5"
            >
              Cámaras
            </Link>
          </div>
        </>
      )}
    </aside>
  )
}

interface SeccionProps {
  icon: React.ReactNode
  titulo: string
  total: number
  children: React.ReactNode
}

function Seccion({ icon, titulo, total, children }: SeccionProps) {
  return (
    <section>
      <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-text-muted uppercase">
        {icon}
        {titulo}
        <span className="font-normal normal-case">· {total}</span>
      </h4>
      {total === 0 ? (
        <p className="py-1 text-[11px] text-text-muted">Sin registros</p>
      ) : (
        <ul className="divide-y divide-border/50">{children}</ul>
      )}
    </section>
  )
}

/** Aviso para las casas que no se pueden dibujar por no tener coordenadas. */
export function CasasSinUbicar({ total }: { total: number }) {
  if (total === 0) return null
  return (
    <div className="glass-card absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-bg-surface/90 px-3 py-2 text-xs text-text-muted">
      <MapPinOff size={14} className="text-accent-amber" />
      {total} {total === 1 ? 'casa sin coordenadas' : 'casas sin coordenadas'} · se capturan en el
      panel de administración
    </div>
  )
}
