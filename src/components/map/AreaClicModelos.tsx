// Depuración: dibuja sobre el mapa la zona que responde al clic de cada modelo
// propio. Es el mismo polígono con el que se decide el clic (areaClic.ts), así
// que lo que se ve es exactamente lo que responde.

import { useEffect, useState, type RefObject } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import type { Modelo3D } from '@/shared'
import { poligonoClic, type Punto } from './areaClic'

interface AreaClicModelosProps {
  mapRef: RefObject<MapboxMap | null>
  /** Modelos visibles, con sus ajustes aplicados. */
  modelos: Modelo3D[]
  resaltado: string | null
}

export function AreaClicModelos({ mapRef, modelos, resaltado }: AreaClicModelosProps) {
  const [poligonos, setPoligonos] = useState<{ id: string; puntos: string; ancla: Punto }[]>([])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Se recalcula con cada fotograma del mapa (mover, girar, inclinar), pero
    // como mucho una vez por cuadro de animación.
    let cuadro = 0
    const calcular = () => {
      cuadro = 0
      setPoligonos(
        modelos.flatMap((m) => {
          const poligono = poligonoClic(map, m)
          if (!poligono) return []
          return [
            {
              id: m.id,
              puntos: poligono.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
              ancla: map.project([m.lng, m.lat]),
            },
          ]
        }),
      )
    }
    const alPintar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(calcular)
    }

    map.on('render', alPintar)
    alPintar()
    return () => {
      map.off('render', alPintar)
      cancelAnimationFrame(cuadro)
    }
  }, [mapRef, modelos])

  return (
    <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full">
      {poligonos.map(({ id, puntos, ancla }) => {
        const color = id === resaltado ? '#3b82f6' : '#f59e0b'
        return (
          <g key={id}>
            <polygon
              points={puntos}
              fill={color}
              fillOpacity={0.12}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            {/* Punto de anclaje: la coordenada del modelo, en el suelo. */}
            <circle cx={ancla.x} cy={ancla.y} r={4} fill={color} stroke="white" strokeWidth={1.5} />
          </g>
        )
      })}
    </svg>
  )
}
