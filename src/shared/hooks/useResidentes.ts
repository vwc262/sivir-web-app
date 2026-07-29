// Residentes de cada casa del condominio activo.
//
// La relación usuario↔casa vive en las membresías; los nombres, en el espejo
// local de identidades. Se cruzan aquí porque el core expone ambas colecciones
// por separado (patrón Hydrate) y son pequeñas.

import { useEffect, useMemo, useState } from 'react'
import { listMembresias, listUsuarios, type Membresia, type Usuario } from '../api'
import { useAuthStore } from '../store/useAuthStore'

export interface Residente {
  userId: string
  nombre: string
  rol: string
}

export function useResidentes(): { residentesDe: (casaId: string) => Residente[] } {
  const condominioId = useAuthStore((s) => s.session?.condominioId ?? '')
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  useEffect(() => {
    if (!condominioId) {
      setMembresias([])
      setUsuarios([])
      return
    }
    let cancelled = false

    Promise.all([listMembresias(condominioId), listUsuarios()])
      .then(([mem, users]) => {
        if (cancelled) return
        setMembresias(mem.data)
        setUsuarios(users.data)
      })
      .catch(() => {
        // Los residentes son un dato de apoyo: si falla, la casa se muestra sin
        // ellos en lugar de dejar el panel inservible.
        if (!cancelled) {
          setMembresias([])
          setUsuarios([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [condominioId])

  return useMemo(() => {
    const nombrePorUsuario = new Map(
      usuarios.map((u) => [u.id, u.displayName || u.username]),
    )

    const porCasa = new Map<string, Residente[]>()
    for (const m of membresias) {
      // Membresía sin casa = alcance a todo el condominio (administración), no
      // residente de una vivienda concreta.
      if (!m.casaId) continue
      const lista = porCasa.get(m.casaId) ?? []
      lista.push({
        userId: m.userId,
        nombre: nombrePorUsuario.get(m.userId) ?? m.userId,
        rol: m.role,
      })
      porCasa.set(m.casaId, lista)
    }

    return { residentesDe: (casaId: string) => porCasa.get(casaId) ?? [] }
  }, [membresias, usuarios])
}
