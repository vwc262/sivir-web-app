// Residentes de cada casa del condominio activo, con sus dispositivos.
//
// Tres colecciones que el core expone por separado (patrón Hydrate) y que se
// cruzan aquí: la membresía dice qué usuario vive en qué casa, el espejo de
// identidades pone el nombre y los dispositivos cuelgan del usuario, no de la
// casa —de ahí que haya que pasar por el usuario para saber qué aparatos hay en
// una vivienda—.

import { useEffect, useMemo, useState } from 'react'
import {
  listDispositivos,
  listMembresias,
  listUsuarios,
  type Dispositivo,
  type Membresia,
  type Usuario,
} from '../api'
import { useAuthStore } from '../store/useAuthStore'

export interface Residente {
  userId: string
  nombre: string
  rol: string
  dispositivos: Dispositivo[]
}

export interface Inventario {
  residentesDe: (casaId: string) => Residente[]
  /** Alias del dispositivo y nombre de su dueño, para etiquetar el mapa. */
  etiquetaDispositivo: (dispositivoID: string) => string
}

export function useResidentes(): Inventario {
  const condominioId = useAuthStore((s) => s.session?.condominioId ?? '')
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])

  useEffect(() => {
    if (!condominioId) {
      setMembresias([])
      setUsuarios([])
      setDispositivos([])
      return
    }
    let cancelled = false

    Promise.all([listMembresias(condominioId), listUsuarios(), listDispositivos()])
      .then(([mem, users, devs]) => {
        if (cancelled) return
        setMembresias(mem.data)
        setUsuarios(users.data)
        setDispositivos(devs.data)
      })
      .catch(() => {
        // Los residentes son un dato de apoyo: si falla, la casa se muestra sin
        // ellos en lugar de dejar el panel inservible.
        if (!cancelled) {
          setMembresias([])
          setUsuarios([])
          setDispositivos([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [condominioId])

  return useMemo(() => {
    const nombrePorUsuario = new Map(usuarios.map((u) => [u.id, u.displayName || u.username]))

    const dispositivosPorUsuario = new Map<string, Dispositivo[]>()
    for (const dispositivo of dispositivos) {
      const lista = dispositivosPorUsuario.get(dispositivo.userId) ?? []
      lista.push(dispositivo)
      dispositivosPorUsuario.set(dispositivo.userId, lista)
    }

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
        dispositivos: dispositivosPorUsuario.get(m.userId) ?? [],
      })
      porCasa.set(m.casaId, lista)
    }

    const dispositivoPorId = new Map(dispositivos.map((d) => [d.id, d]))

    return {
      residentesDe: (casaId: string) => porCasa.get(casaId) ?? [],
      etiquetaDispositivo: (dispositivoID: string) => {
        const dispositivo = dispositivoPorId.get(dispositivoID)
        if (!dispositivo) return dispositivoID
        const dueno = nombrePorUsuario.get(dispositivo.userId)
        return dueno ? `${dispositivo.alias} · ${dueno}` : dispositivo.alias
      },
    }
  }, [membresias, usuarios, dispositivos])
}
