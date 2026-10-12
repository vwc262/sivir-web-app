import type { RefObject } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import { Plus, Minus, Compass, Crosshair } from 'lucide-react'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/shared'

interface MapControlsProps {
  mapRef: RefObject<MapboxMap | null>
  /** Centro del condominio activo, si está geolocalizado. */
  centro?: [number, number] | null
  zoomCondominio: number
}

export function MapControls({ mapRef, centro, zoomCondominio }: MapControlsProps) {
  const controls = [
    { icon: Plus, label: 'Acercar', action: () => mapRef.current?.zoomIn() },
    { icon: Minus, label: 'Alejar', action: () => mapRef.current?.zoomOut() },
    {
      icon: Compass,
      label: 'Resetear orientación',
      action: () => mapRef.current?.easeTo({ bearing: 0, pitch: 0 }),
    },
    {
      icon: Crosshair,
      // Sin condominio geolocalizado no hay a dónde volver: se usa el encuadre
      // por defecto en lugar de dejar el botón sin efecto.
      label: centro ? 'Centrar en el condominio' : 'Encuadre por defecto',
      action: () =>
        mapRef.current?.flyTo(
          centro ? { center: centro, zoom: zoomCondominio } : { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM },
        ),
    },
  ] as const

  return (
    // Opaco y con borde: sobre edificios en 3D, un fondo translúcido se pierde.
    <div className="absolute top-4 right-4 z-10 flex flex-col divide-y divide-white/10 overflow-hidden rounded-xl border border-white/15 bg-bg-surface shadow-xl shadow-black/50">
      {controls.map(({ icon: Icon, label, action }) => (
        <button
          key={label}
          onClick={action}
          aria-label={label}
          title={label}
          className="flex h-10 w-10 items-center justify-center text-slate-200 transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  )
}
