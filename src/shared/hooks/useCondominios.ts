// Carga los condominios del core y garantiza que siempre haya uno activo.
//
// El condominio es el contexto de todo el sitio: es la clave de partición de la
// telemetría y el canal por el que llegan las alertas. Sin uno seleccionado, el
// hub no admite la conexión, así que en modo dev se elige el primero en cuanto
// se conocen.

import { useCallback, useEffect, useState } from 'react'
import { listCondominios, type Condominio, HttpError } from '../api'
import { useAuthStore } from '../store/useAuthStore'

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

        // Autoselección: solo cuando el sitio manda sobre el condominio (dev).
        // En modo keycloak lo fija el token y `setCondominio` lo ignora.
        const session = useAuthStore.getState().session
        if (session?.mode === 'dev' && !session.condominioId && data.length > 0) {
          useAuthStore.getState().setCondominio(data[0].id)
        }
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
