// Consultas de telemetría del condominio activo.
//
// Dos caminos, porque el almacén tiene dos tablas y no son intercambiables:
//   - "vivo": últimas 24 h desde `telemetry_live`, una sola partición.
//   - "rango": histórico, que el core recorre día a día (`telemetry_history`)
//     y devuelve ya agregado.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { HttpError, getInforme, listLecturas, type Lectura } from '../api'
import { useAuthStore } from '../store/useAuthStore'

/** Agregados de un conjunto de lecturas, vengan del core o calculados aquí. */
export interface Resumen {
  total: number
  media: number
  maximo: number
  minimo: number
}

export type Rango = { modo: 'vivo' } | { modo: 'rango'; desde: string; hasta: string }

interface SensorTelemetria {
  lecturas: Lectura[]
  resumen: Resumen | null
  loading: boolean
  error: string | null
}

const SIN_LECTURAS: Resumen = { total: 0, media: 0, maximo: 0, minimo: 0 }

/** Agrega en el navegador las lecturas que ya se tienen (modo vivo). */
function resumir(lecturas: Lectura[]): Resumen {
  if (lecturas.length === 0) return SIN_LECTURAS
  let suma = 0
  let maximo = lecturas[0].value
  let minimo = lecturas[0].value
  for (const l of lecturas) {
    suma += l.value
    if (l.value > maximo) maximo = l.value
    if (l.value < minimo) minimo = l.value
  }
  return { total: lecturas.length, media: suma / lecturas.length, maximo, minimo }
}

function mensajeDeError(cause: unknown, porDefecto: string): string {
  return cause instanceof HttpError ? cause.message : porDefecto
}

/**
 * Última lectura conocida de cada sensor del condominio.
 *
 * Se trae la partición viva completa en una sola consulta y se indexa aquí, en
 * lugar de pedir una lectura por sensor: son N peticiones contra la misma
 * partición de Cassandra.
 */
export function useUltimasLecturas(): {
  porSensor: Map<string, Lectura>
  loading: boolean
  error: string | null
  refrescar: () => void
} {
  const condominioId = useAuthStore((s) => s.session?.condominioId ?? '')
  const [lecturas, setLecturas] = useState<Lectura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState(0)

  const refrescar = useCallback(() => setToken((n) => n + 1), [])

  useEffect(() => {
    if (!condominioId) {
      setLecturas([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    listLecturas({ condominioId })
      .then(({ data }) => {
        if (cancelled) return
        setLecturas(data)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setLecturas([])
        setError(mensajeDeError(cause, 'No se pudo consultar la telemetría'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [condominioId, token])

  // El core devuelve las lecturas de la más reciente a la más antigua: la
  // primera de cada sensor es su última lectura.
  const porSensor = useMemo(() => {
    const mapa = new Map<string, Lectura>()
    for (const lectura of lecturas) {
      if (!mapa.has(lectura.sensorId)) mapa.set(lectura.sensorId, lectura)
    }
    return mapa
  }, [lecturas])

  return { porSensor, loading, error, refrescar }
}

/** Lecturas y agregados de un sensor concreto. */
export function useSensorTelemetria(sensorId: string, rango: Rango): SensorTelemetria {
  const condominioId = useAuthStore((s) => s.session?.condominioId ?? '')
  const [lecturas, setLecturas] = useState<Lectura[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // El objeto `rango` se recrea en cada render: se depende de sus valores.
  const desde = rango.modo === 'rango' ? rango.desde : ''
  const hasta = rango.modo === 'rango' ? rango.hasta : ''

  useEffect(() => {
    if (!condominioId || !sensorId) {
      setLecturas([])
      setResumen(null)
      return
    }
    let cancelled = false
    setLoading(true)

    const consulta =
      desde && hasta
        ? getInforme({ condominioId, sensorId, desde, hasta }).then((informe) => ({
            lecturas: informe.lecturas ?? [],
            // En el rango los agregados los calcula el core sobre TODAS las
            // lecturas del periodo, no solo sobre las que devuelve.
            resumen: {
              total: informe.totalLecturas,
              media: informe.media,
              maximo: informe.maximo,
              minimo: informe.minimo,
            },
          }))
        : listLecturas({ condominioId, sensorId }).then(({ data }) => ({
            lecturas: data,
            resumen: resumir(data),
          }))

    consulta
      .then((resultado) => {
        if (cancelled) return
        setLecturas(resultado.lecturas)
        setResumen(resultado.resumen)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setLecturas([])
        setResumen(null)
        setError(mensajeDeError(cause, 'No se pudieron consultar las lecturas del sensor'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [condominioId, sensorId, desde, hasta])

  return { lecturas, resumen, loading, error }
}
