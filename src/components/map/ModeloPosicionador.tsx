// Herramienta para colocar los modelos 3D en su sitio sin ir probando valores a
// mano: flechas que desplazan el modelo un número fijo de metros, botones para
// girarlo y escalarlo, un modo para llevarlo de un clic a otro punto del mapa,
// y un botón que copia los valores resultantes, listos para pegar en
// src/shared/modelos3d.ts.
//
// El modelo a ajustar se elige con el desplegable o haciendo clic sobre él en
// el mapa (ver MapView). Las flechas siguen la pantalla, no los puntos
// cardinales: con el mapa girado, "arriba" sigue siendo hacia donde mira la
// cámara.
//
// Va sobre un mapa con mucho detalle en 3D: el panel es opaco y los botones
// tienen fondo propio para no perderse contra los edificios.

import { useState, type ReactNode, type RefObject } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Copy,
  Check,
  RotateCcw,
  RotateCw,
  Undo2,
  Minus,
  Plus,
  Move,
  MousePointerClick,
  Eye,
  EyeOff,
  ScanSearch,
} from 'lucide-react'
import type { Modelo3D } from '@/shared'
import { Toggle } from '../ui/Toggle'
import { useAjusteModelos } from './useAjusteModelos'

/** Pasos de desplazamiento, en metros. */
const PASOS_M = [0.5, 1, 5, 10, 50] as const
/** Pasos de giro, en grados. */
const PASOS_GRADOS = [1, 5, 15, 90] as const
/** Pasos de escala, en porcentaje. */
const PASOS_ESCALA = [1, 5, 25] as const

/** Decimales al copiar coordenadas: 7 son ~1 cm, más de lo que el ojo distingue. */
const DECIMALES = 7

const BOTON =
  'flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-slate-100 transition-colors hover:bg-white/20 cursor-pointer'

interface ModeloPosicionadorProps {
  mapRef: RefObject<MapboxMap | null>
  /** Modelos con los ajustes ya aplicados. */
  modelos: Modelo3D[]
}

/** Fila de pasos seleccionables, con el activo resaltado. */
function Pasos<T extends number>({
  valores,
  activo,
  onChange,
  formato,
}: {
  valores: readonly T[]
  activo: T
  onChange: (v: T) => void
  formato: (v: T) => string
}) {
  return (
    <div className="flex flex-1 gap-1">
      {valores.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex-1 rounded-md py-1 text-[11px] font-medium transition-colors cursor-pointer ${
            activo === v
              ? 'bg-accent-blue text-white'
              : 'bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white'
          }`}
        >
          {formato(v)}
        </button>
      ))}
    </div>
  )
}

function Seccion({ titulo, valor, children }: { titulo: string; valor?: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/10 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">{titulo}</p>
        {valor && <p className="font-mono text-[11px] text-slate-100">{valor}</p>}
      </div>
      {children}
    </div>
  )
}

export function ModeloPosicionador({ mapRef, modelos }: ModeloPosicionadorProps) {
  const [pasoM, setPasoM] = useState<(typeof PASOS_M)[number]>(1)
  const [pasoGrados, setPasoGrados] = useState<(typeof PASOS_GRADOS)[number]>(5)
  const [pasoEscala, setPasoEscala] = useState<(typeof PASOS_ESCALA)[number]>(5)
  const [copiado, setCopiado] = useState<'no' | 'si' | 'error'>('no')

  const ajustes = useAjusteModelos((s) => s.ajustes)
  const seleccionado = useAjusteModelos((s) => s.seleccionado)
  const colocandoConClic = useAjusteModelos((s) => s.colocandoConClic)
  const ocultos = useAjusteModelos((s) => s.ocultos)
  const mostrarAreaClic = useAjusteModelos((s) => s.mostrarAreaClic)
  const {
    seleccionar,
    setColocandoConClic,
    desplazar,
    girar,
    escalar,
    restablecer,
    alternarOculto,
    setMostrarAreaClic,
  } = useAjusteModelos.getState()

  const modelo = modelos.find((m) => m.id === seleccionado) ?? modelos[0]
  if (!modelo) return null
  const oculto = Boolean(ocultos[modelo.id])

  const escala = modelo.escala ?? 1
  const rotacion = modelo.rotacion ?? 0
  const texto =
    `lat: ${modelo.lat.toFixed(DECIMALES)}, lng: ${modelo.lng.toFixed(DECIMALES)}, ` +
    `escala: ${Number(escala.toFixed(3))}, rotacion: ${Number(rotacion.toFixed(1))}`
  const ajustado = modelo.id in ajustes

  /** Tras cualquier cambio, lo copiado deja de corresponder a lo que se ve. */
  const cambiar = (accion: () => void) => {
    accion()
    setCopiado('no')
  }

  /** dx: derecha (+) / izquierda (−); dy: arriba (+) / abajo (−), en pasos. */
  function mover(dx: number, dy: number) {
    // El rumbo es hacia dónde apunta la parte de arriba de la pantalla, en
    // grados desde el norte. Se gira el desplazamiento de pantalla con él para
    // obtener cuánto va al este y cuánto al norte.
    const rumbo = ((mapRef.current?.getBearing() ?? 0) * Math.PI) / 180
    const este = pasoM * (dx * Math.cos(rumbo) + dy * Math.sin(rumbo))
    const norte = pasoM * (-dx * Math.sin(rumbo) + dy * Math.cos(rumbo))
    cambiar(() => desplazar(modelo.id, este, norte))
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado('si')
    } catch {
      // El portapapeles solo está disponible en contexto seguro (https o
      // localhost). Si falla, el texto queda seleccionable a mano.
      setCopiado('error')
    }
  }

  const flechas = [
    { icon: ArrowUp, label: 'Arriba', dx: 0, dy: 1, area: 'col-start-2 row-start-1' },
    { icon: ArrowLeft, label: 'Izquierda', dx: -1, dy: 0, area: 'col-start-1 row-start-2' },
    { icon: ArrowRight, label: 'Derecha', dx: 1, dy: 0, area: 'col-start-3 row-start-2' },
    { icon: ArrowDown, label: 'Abajo', dx: 0, dy: -1, area: 'col-start-2 row-start-3' },
  ] as const

  return (
    <div className="absolute top-4 left-4 z-10 flex max-h-[calc(100%-2rem)] w-72 flex-col gap-3 overflow-y-auto rounded-xl border border-white/15 bg-bg-surface p-3 text-xs text-slate-100 shadow-xl shadow-black/50">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Move size={15} />
          Posicionar modelo
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Haz clic sobre un modelo para elegirlo.</p>
      </div>

      {/* Siempre visible, aunque haya un solo sitio: es también la forma de
          llegar a él cuando está fuera de la vista. */}
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">Sitio</span>
        <select
          value={modelo.id}
          onChange={(e) => {
            const id = e.target.value
            cambiar(() => seleccionar(id))
            // Al elegir un sitio se va hasta él: los modelos pueden estar
            // repartidos por la ciudad y el elegido, fuera de pantalla.
            const destino = modelos.find((m) => m.id === id)
            if (destino) mapRef.current?.flyTo({ center: [destino.lng, destino.lat] })
          }}
          className="w-full cursor-pointer rounded-lg border border-white/15 bg-bg-deep px-2 py-1.5 text-sm text-slate-100 focus:border-accent-blue focus:outline-none"
        >
          {modelos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre ?? m.id} · {m.archivo}
            </option>
          ))}
        </select>
      </label>

      <Seccion titulo="Vista">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-100">
              {oculto ? <EyeOff size={14} /> : <Eye size={14} />}
              Mostrar edificio
            </span>
            <Toggle checked={!oculto} onChange={() => alternarOculto(modelo.id)} ariaLabel="Mostrar edificio" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-100">
              <ScanSearch size={14} />
              Área de clic
            </span>
            <Toggle checked={mostrarAreaClic} onChange={setMostrarAreaClic} ariaLabel="Mostrar área de clic" />
          </div>
          {oculto && (
            <p className="text-[11px] text-slate-400">Oculto: tampoco responde al clic hasta mostrarlo.</p>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Mover">
        <div className="mb-2 flex">
          <Pasos valores={PASOS_M} activo={pasoM} onChange={setPasoM} formato={(v) => `${v} m`} />
        </div>
        <div className="mx-auto grid w-fit grid-cols-3 grid-rows-3 gap-1">
          {flechas.map(({ icon: Icon, label, dx, dy, area }) => (
            <button
              key={label}
              onClick={() => mover(dx, dy)}
              aria-label={`Mover ${pasoM} m hacia ${label.toLowerCase()}`}
              title={`${label} ${pasoM} m`}
              className={`${BOTON} ${area}`}
            >
              <Icon size={16} />
            </button>
          ))}
          <button
            onClick={() => mapRef.current?.flyTo({ center: [modelo.lng, modelo.lat] })}
            aria-label="Centrar el mapa en el modelo"
            title="Centrar el mapa en el modelo"
            className={`${BOTON} col-start-2 row-start-2`}
          >
            <Crosshair size={16} />
          </button>
        </div>
        <button
          onClick={() => setColocandoConClic(!colocandoConClic)}
          className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 font-medium transition-colors cursor-pointer ${
            colocandoConClic
              ? 'border-accent-amber bg-accent-amber/20 text-accent-amber'
              : 'border-white/10 bg-white/10 text-slate-100 hover:bg-white/20'
          }`}
        >
          <MousePointerClick size={14} />
          {colocandoConClic ? 'Haz clic en el mapa… (cancelar)' : 'Colocar con clic'}
        </button>
      </Seccion>

      <Seccion titulo="Girar" valor={`${Number(rotacion.toFixed(1))}°`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cambiar(() => girar(modelo.id, -pasoGrados))}
            aria-label={`Girar ${pasoGrados}° a la izquierda`}
            title={`Girar ${pasoGrados}° a la izquierda`}
            className={BOTON}
          >
            <RotateCcw size={16} />
          </button>
          <Pasos valores={PASOS_GRADOS} activo={pasoGrados} onChange={setPasoGrados} formato={(v) => `${v}°`} />
          <button
            onClick={() => cambiar(() => girar(modelo.id, pasoGrados))}
            aria-label={`Girar ${pasoGrados}° a la derecha`}
            title={`Girar ${pasoGrados}° a la derecha`}
            className={BOTON}
          >
            <RotateCw size={16} />
          </button>
        </div>
      </Seccion>

      <Seccion titulo="Escala" valor={`×${Number(escala.toFixed(3))}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cambiar(() => escalar(modelo.id, 1 / (1 + pasoEscala / 100)))}
            aria-label={`Reducir ${pasoEscala} %`}
            title={`Reducir ${pasoEscala} %`}
            className={BOTON}
          >
            <Minus size={16} />
          </button>
          <Pasos valores={PASOS_ESCALA} activo={pasoEscala} onChange={setPasoEscala} formato={(v) => `${v} %`} />
          <button
            onClick={() => cambiar(() => escalar(modelo.id, 1 + pasoEscala / 100))}
            aria-label={`Ampliar ${pasoEscala} %`}
            title={`Ampliar ${pasoEscala} %`}
            className={BOTON}
          >
            <Plus size={16} />
          </button>
        </div>
      </Seccion>

      <div className="border-t border-white/10 pt-3">
        <p className="mb-2 rounded-lg border border-white/10 bg-bg-deep px-2 py-1.5 font-mono text-[11px] leading-relaxed break-all text-slate-100 select-all">
          {texto}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => void copiar()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent-blue py-1.5 font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
          >
            {copiado === 'si' ? <Check size={14} /> : <Copy size={14} />}
            {copiado === 'si' ? 'Copiado' : 'Copiar valores'}
          </button>
          <button
            onClick={() => cambiar(() => restablecer(modelo.id))}
            disabled={!ajustado}
            aria-label="Volver a los valores del archivo"
            title="Volver a los valores del archivo"
            className={`${BOTON} disabled:cursor-default disabled:opacity-30 disabled:hover:bg-white/10`}
          >
            <Undo2 size={14} />
          </button>
        </div>
        {copiado === 'error' && (
          <p className="mt-2 text-accent-amber">
            No se pudo copiar automáticamente; selecciona el texto de arriba.
          </p>
        )}
      </div>
    </div>
  )
}
