// Cámaras del condominio activo, agrupadas por casa.
//
// El inventario manda: qué cámaras existen, en qué casa están y si están
// habilitadas lo dice el core. El sitio solo reproduce lo que ese inventario
// declara, con la URL HLS que el propio core construye.

import { useEffect, useMemo, useState } from 'react'
import { HttpError, listCamaras, listCasas, type Camara, type Casa } from '../api'
import { useAuthStore } from '../store/useAuthStore'

export interface CasaConCamaras {
  casa: Casa
  camaras: Camara[]
}

interface CamarasState {
  /** Casas del condominio que tienen al menos una cámara. */
  grupos: CasaConCamaras[]
  /** Todas las cámaras del condominio, en el orden en que se muestran. */
  camaras: Camara[]
  loading: boolean
  error: string | null
}

export function useCamaras(): CamarasState {
  const condominioId = useAuthStore((s) => s.session?.condominioId ?? '')
  const [casas, setCasas] = useState<Casa[]>([])
  const [camaras, setCamaras] = useState<Camara[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!condominioId) {
      setCasas([])
      setCamaras([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    // Como con los sensores, el core filtra cámaras por casa y no por
    // condominio: se traen todas y se recortan con las casas del condominio.
    Promise.all([listCasas(condominioId), listCamaras()])
      .then(([casasRes, camarasRes]) => {
        if (cancelled) return
        const propias = new Set(casasRes.data.map((c) => c.id))
        setCasas(casasRes.data)
        setCamaras(camarasRes.data.filter((c) => propias.has(c.casaId)))
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setCasas([])
        setCamaras([])
        setError(
          cause instanceof HttpError ? cause.message : 'No se pudo consultar el inventario de cámaras',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [condominioId])

  const grupos = useMemo(() => {
    return casas
      .map((casa) => ({ casa, camaras: camaras.filter((c) => c.casaId === casa.id) }))
      .filter((grupo) => grupo.camaras.length > 0)
  }, [casas, camaras])

  // El orden plano sigue al agrupado: así la primera cámara de la lista es la
  // misma que se ve primero en pantalla.
  const ordenadas = useMemo(() => grupos.flatMap((g) => g.camaras), [grupos])

  return { grupos, camaras: ordenadas, loading, error }
}
