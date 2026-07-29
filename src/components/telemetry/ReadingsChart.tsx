import { useMemo } from 'react'
import type { Lectura } from '@/shared'

interface ReadingsChartProps {
  /** Lecturas de la más reciente a la más antigua, como las devuelve el core. */
  lecturas: Lectura[]
  unidad?: string
}

// Coordenadas del lienzo. El SVG escala con el contenedor: estas unidades solo
// fijan la proporción y el grosor relativo de los trazos.
const ANCHO = 600
const ALTO = 160
const MARGEN = 8

/**
 * Gráfica de la evolución de un sensor.
 *
 * Un SVG a mano en vez de una librería de gráficos: es una serie simple y no
 * compensa cargar 100 kB para dibujar una polilínea.
 */
export function ReadingsChart({ lecturas, unidad }: ReadingsChartProps) {
  const serie = useMemo(() => {
    // Cronológico para dibujar de izquierda a derecha.
    const puntos = [...lecturas].reverse()
    if (puntos.length === 0) return null

    const valores = puntos.map((p) => p.value)
    const max = Math.max(...valores)
    const min = Math.min(...valores)
    // Serie plana (un sensor de puerta siempre en 1): sin rango no hay escala,
    // así que se dibuja centrada en lugar de dividir por cero.
    const rango = max - min || 1

    const x = (i: number) =>
      MARGEN + (puntos.length === 1 ? (ANCHO - 2 * MARGEN) / 2 : (i * (ANCHO - 2 * MARGEN)) / (puntos.length - 1))
    const y = (v: number) => ALTO - MARGEN - ((v - min) / rango) * (ALTO - 2 * MARGEN)

    const linea = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ')
    const area = `${linea} L${x(puntos.length - 1)},${ALTO} L${x(0)},${ALTO} Z`

    return { puntos, max, min, linea, area, x, y }
  }, [lecturas])

  if (!serie) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-text-muted">
        Sin lecturas en el periodo seleccionado
      </div>
    )
  }

  const formato = (v: number) => `${Number(v.toFixed(2))}${unidad ? ` ${unidad}` : ''}`

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label={`Evolución del sensor: ${serie.puntos.length} lecturas`}
      >
        <defs>
          <linearGradient id="grad-lecturas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-blue)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-accent-blue)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={serie.area} fill="url(#grad-lecturas)" />
        <path
          d={serie.linea}
          fill="none"
          stroke="var(--color-accent-blue)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        {/* Con pocas lecturas los puntos ayudan a leer la serie; con muchas la ensucian. */}
        {serie.puntos.length <= 40 &&
          serie.puntos.map((p, i) => (
            <circle
              key={p.id}
              cx={serie.x(i)}
              cy={serie.y(p.value)}
              r="3"
              fill="var(--color-accent-blue)"
              vectorEffect="non-scaling-stroke"
            />
          ))}
      </svg>

      <div className="pointer-events-none absolute inset-y-0 left-1 flex flex-col justify-between py-1 text-[10px] text-text-muted">
        <span>{formato(serie.max)}</span>
        <span>{formato(serie.min)}</span>
      </div>
    </div>
  )
}
