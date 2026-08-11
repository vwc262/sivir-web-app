// Carga los condominios del core.
//
// El condominio es el contexto de todo el sitio: es la clave de partición de la
// telemetría y el canal por el que llegan las alertas. Lo fija el claim del
// token de Keycloak; este hook solo lista el catálogo para mostrarlo.

import { useCallback, useEffect, useState } from 'react'
import { listCondominios, type Condominio, HttpError } from '../api'

interface CondominiosState {
  condominios: Condominio[]
  loading: boolean
  error: string | null
  /** Vuelve a consultar el core (por ejemplo, tras recuperar la conexión). */
  reload: () => void
}

export function useCondominios(): CondominiosState {
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    listCondominios()
      .then(({ data }) => {
        if (cancelled) return
        setCondominios(data)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(
          cause instanceof HttpError
            ? cause.message
            : 'No se pudo consultar el listado de condominios',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  return { condominios, loading, error, reload }
}
