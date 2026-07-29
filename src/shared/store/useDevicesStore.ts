// Estado en vivo de los dispositivos, tal como lo va empujando el hub.
//
// No se persiste: es el presente, y al recargar la página el hub vuelve a
// mandar su instantánea. Guardarlo solo serviría para mostrar posiciones viejas
// como si fueran actuales.

import { useMemo } from 'react'
import { create } from 'zustand'
import type { DeviceState } from '../realtime/types'

interface DevicesState {
  /** Último estado conocido de cada dispositivo, por id. */
  porDispositivo: Record<string, DeviceState>
  aplicar: (estado: DeviceState) => void
  aplicarVarios: (estados: DeviceState[]) => void
  limpiar: () => void
}

export const useDevicesStore = create<DevicesState>((set) => ({
  porDispositivo: {},

  aplicar: (estado) =>
    set((s) => {
      // Los mensajes pueden llegar desordenados tras una reconexión: un estado
      // más viejo que el que ya se tiene no debe pisarlo.
      const actual = s.porDispositivo[estado.dispositivo_id]
      if (actual && actual.updated_at > estado.updated_at) return s
      return { porDispositivo: { ...s.porDispositivo, [estado.dispositivo_id]: estado } }
    }),

  aplicarVarios: (estados) =>
    set((s) => {
      const siguiente = { ...s.porDispositivo }
      for (const estado of estados) {
        const actual = siguiente[estado.dispositivo_id]
        if (actual && actual.updated_at > estado.updated_at) continue
        siguiente[estado.dispositivo_id] = estado
      }
      return { porDispositivo: siguiente }
    }),

  limpiar: () => set({ porDispositivo: {} }),
}))

/**
 * Estados en vivo como lista, del reporte más reciente al más antiguo.
 *
 * La lista se deriva con useMemo y no dentro del selector: un selector que
 * construye un array devuelve una referencia distinta en cada llamada, y el
 * store lo interpretaría como un cambio de estado en cada render —bucle
 * infinito—.
 */
export const useDeviceStates = (): DeviceState[] => {
  const porDispositivo = useDevicesStore((s) => s.porDispositivo)
  return useMemo(
    () => Object.values(porDispositivo).sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [porDispositivo],
  )
}

/**
 * Un dispositivo por usuario: el activo.
 *
 * Una persona puede tener móvil, tablet y PC registrados, pero en el mapa
 * representa un punto, no tres. Se elige el que está conectado y, entre varios,
 * el que reportó más recientemente. Si ninguno está conectado se conserva el
 * último conocido: saber dónde se le vio por última vez sigue siendo útil, y
 * dejarlo fuera equivaldría a afirmar que no está en ninguna parte.
 */
export function dispositivoActivoPorUsuario(estados: DeviceState[]): DeviceState[] {
  const porUsuario = new Map<string, DeviceState>()

  for (const estado of estados) {
    const actual = porUsuario.get(estado.user_id)
    if (!actual) {
      porUsuario.set(estado.user_id, estado)
      continue
    }
    if (estado.online !== actual.online) {
      if (estado.online) porUsuario.set(estado.user_id, estado)
      continue
    }
    if (estado.updated_at > actual.updated_at) porUsuario.set(estado.user_id, estado)
  }

  return [...porUsuario.values()]
}
