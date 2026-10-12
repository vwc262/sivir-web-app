import type { ReactNode } from 'react'
import { X, Building2, MapPin, Clock, Layers, Ruler, User, Phone, Box } from 'lucide-react'
import { infoDeSitio, useMapStore, type EstadoSitio } from '@/shared'
import { Badge } from '../ui/Badge'
import { modelosAjustados, useAjusteModelos } from './useAjusteModelos'

const ESTADO: Record<EstadoSitio, { color: 'green' | 'amber' | 'red'; texto: string }> = {
  operativo: { color: 'green', texto: '● Operativo' },
  mantenimiento: { color: 'amber', texto: '● En mantenimiento' },
  cerrado: { color: 'red', texto: '● Cerrado' },
}

function Dato({ icon, etiqueta, children }: { icon: ReactNode; etiqueta: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 py-2">
      <span className="mt-0.5 shrink-0 text-text-muted">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-text-muted">{etiqueta}</p>
        <p className="text-xs break-words">{children}</p>
      </div>
    </li>
  )
}

/**
 * Información del sitio 3D en que se hizo clic. Ocupa el mismo lugar que el
 * detalle de una casa; abrir uno cierra el otro (ver useMapStore).
 */
export function ModeloDetailPanel() {
  const modeloId = useMapStore((s) => s.selectedModeloId)
  const selectModelo = useMapStore((s) => s.selectModelo)
  // Con la herramienta de posicionamiento la ubicación puede estar ajustada:
  // se muestra la que se ve en el mapa, no la del archivo.
  const ajustes = useAjusteModelos((s) => s.ajustes)

  const modelo = modelosAjustados(ajustes).find((m) => m.id === modeloId)
  const abierto = Boolean(modelo)
  const ficha = modelo && infoDeSitio(modelo)

  return (
    <aside
      className={`absolute top-0 right-0 z-20 flex h-full w-[340px] max-w-full flex-col gap-4 overflow-y-auto border-l border-border bg-bg-surface/95 p-5 backdrop-blur-xl transition-transform duration-300 ${
        abierto ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {modelo && ficha && (
        <>
          <header className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="mt-0.5 rounded-lg bg-accent-blue/15 p-1.5 text-accent-blue">
                <Building2 size={16} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{modelo.nombre ?? modelo.id}</h3>
                <p className="text-xs text-text-muted">{ficha.info.tipo}</p>
              </div>
            </div>
            <button
              onClick={() => selectModelo(null)}
              aria-label="Cerrar panel"
              className="rounded-md p-1 text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary cursor-pointer"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-text-muted">Estado</span>
            <Badge color={ESTADO[ficha.info.estado].color}>{ESTADO[ficha.info.estado].texto}</Badge>
          </div>

          {ficha.deEjemplo && (
            <p className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-[11px] text-accent-amber">
              Datos de ejemplo: este sitio todavía no tiene su ficha real.
            </p>
          )}

          <p className="text-xs leading-relaxed text-text-primary/90">{ficha.info.descripcion}</p>

          <ul className="divide-y divide-border">
            <Dato icon={<MapPin size={14} />} etiqueta="Dirección">
              {ficha.info.direccion}
            </Dato>
            <Dato icon={<Clock size={14} />} etiqueta="Horario">
              {ficha.info.horario}
            </Dato>
            <Dato icon={<Layers size={14} />} etiqueta="Niveles">
              {ficha.info.niveles}
            </Dato>
            <Dato icon={<Ruler size={14} />} etiqueta="Superficie">
              {ficha.info.superficieM2.toLocaleString('es-MX')} m²
            </Dato>
          </ul>

          <section>
            <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Responsable
            </h4>
            <ul className="divide-y divide-border">
              <Dato icon={<User size={14} />} etiqueta="Nombre">
                {ficha.info.responsable.nombre}
              </Dato>
              <Dato icon={<Phone size={14} />} etiqueta="Teléfono">
                {ficha.info.responsable.telefono}
              </Dato>
            </ul>
          </section>

          <section className="mt-auto">
            <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Ubicación
            </h4>
            <ul className="divide-y divide-border">
              <Dato icon={<MapPin size={14} />} etiqueta="Coordenadas">
                <span className="font-mono text-[11px]">
                  {modelo.lat.toFixed(6)}, {modelo.lng.toFixed(6)}
                </span>
              </Dato>
              <Dato icon={<Box size={14} />} etiqueta="Modelo">
                <span className="font-mono text-[11px]">{modelo.archivo}</span>
              </Dato>
            </ul>
          </section>
        </>
      )}
    </aside>
  )
}
