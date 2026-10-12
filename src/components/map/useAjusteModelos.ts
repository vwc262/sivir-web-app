// Ajustes hechos a mano a los modelos 3D con la herramienta de
// posicionamiento: posición, giro y escala, y qué modelo se está ajustando.
//
// No se persisten: es una ayuda para encontrar los valores buenos y copiarlos a
// src/shared/modelos3d.ts, que sigue siendo la fuente. Lo ajustado vive hasta
// recargar la página.

import { create } from 'zustand'
import { MODELOS_3D, type Modelo3D } from '@/shared'

/** Metros que mide un grado de latitud; casi constante en todo el planeta. */
const METROS_POR_GRADO = 111_320

/** Lo que se puede ajustar de un modelo; lo que falta queda como en el archivo. */
type Ajuste = Partial<Pick<Modelo3D, 'lat' | 'lng' | 'rotacion' | 'escala'>>

interface AjusteState {
  ajustes: Record<string, Ajuste>
  /** Modelo sobre el que actúan los controles; null si no hay modelos. */
  seleccionado: string | null
  /** Con este modo activo, el siguiente clic en el mapa coloca ahí el modelo. */
  colocandoConClic: boolean
  /** Modelos ocultos en el mapa (ni se dibujan ni responden al clic). */
  ocultos: Record<string, true>
  /** Depuración: dibujar sobre el mapa la zona que responde al clic. */
  mostrarAreaClic: boolean

  seleccionar: (id: string) => void
  setColocandoConClic: (activo: boolean) => void
  alternarOculto: (id: string) => void
  setMostrarAreaClic: (activo: boolean) => void
  /** Desplaza un modelo los metros indicados hacia el este y hacia el norte. */
  desplazar: (id: string, esteM: number, norteM: number) => void
  /** Lleva un modelo a una coordenada concreta. */
  colocar: (id: string, lat: number, lng: number) => void
  /** Gira un modelo los grados indicados sobre su eje vertical. */
  girar: (id: string, grados: number) => void
  /** Multiplica la escala de un modelo por el factor dado. */
  escalar: (id: string, factor: number) => void
  restablecer: (id: string) => void
}

/** Valores efectivos de un modelo: los del archivo con el ajuste encima. */
function actual(id: string, ajustes: Record<string, Ajuste>): Modelo3D | undefined {
  const base = MODELOS_3D.find((m) => m.id === id)
  return base && { ...base, ...ajustes[id] }
}

export const useAjusteModelos = create<AjusteState>((set) => {
  /** Aplica un cambio a un modelo partiendo de sus valores efectivos. */
  const modificar = (id: string, cambio: (m: Modelo3D) => Ajuste) =>
    set((s) => {
      const m = actual(id, s.ajustes)
      if (!m) return s
      return { ajustes: { ...s.ajustes, [id]: { ...s.ajustes[id], ...cambio(m) } } }
    })

  return {
    ajustes: {},
    seleccionado: MODELOS_3D[0]?.id ?? null,
    colocandoConClic: false,
    ocultos: {},
    mostrarAreaClic: false,

    seleccionar: (id) => set({ seleccionado: id }),
    setColocandoConClic: (activo) => set({ colocandoConClic: activo }),
    alternarOculto: (id) =>
      set((s) => {
        const ocultos = { ...s.ocultos }
        if (ocultos[id]) delete ocultos[id]
        else ocultos[id] = true
        return { ocultos }
      }),
    setMostrarAreaClic: (activo) => set({ mostrarAreaClic: activo }),

    desplazar: (id, esteM, norteM) =>
      modificar(id, (m) => ({
        lat: m.lat + norteM / METROS_POR_GRADO,
        // Un grado de longitud mide menos cuanto más lejos del ecuador: en la
        // CDMX, cerca del 6 % menos que uno de latitud.
        lng: m.lng + esteM / (METROS_POR_GRADO * Math.cos((m.lat * Math.PI) / 180)),
      })),

    colocar: (id, lat, lng) => modificar(id, () => ({ lat, lng })),

    // Se normaliza a [0, 360) para que el valor copiado sea legible.
    girar: (id, grados) =>
      modificar(id, (m) => ({ rotacion: ((((m.rotacion ?? 0) + grados) % 360) + 360) % 360 })),

    escalar: (id, factor) => modificar(id, (m) => ({ escala: (m.escala ?? 1) * factor })),

    restablecer: (id) =>
      set((s) => {
        const ajustes = { ...s.ajustes }
        delete ajustes[id]
        return { ajustes }
      }),
  }
})

/** Los modelos configurados, con los ajustes aplicados encima. */
export function modelosAjustados(ajustes: Record<string, Ajuste>): Modelo3D[] {
  return MODELOS_3D.map((m) => ({ ...m, ...ajustes[m.id] }))
}
