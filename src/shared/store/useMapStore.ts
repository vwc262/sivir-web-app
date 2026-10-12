import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Iluminacion, MapProvider } from '../types'
import { STORAGE_KEYS } from '../constants'
import { sivirStorage } from './storage'

interface MapState {
  provider: MapProvider
  /** Luz de la escena 3D; es una preferencia del usuario, como el proveedor. */
  iluminacion: Iluminacion
  /**
   * Casa abierta en el panel de detalle. Se guarda el id y no la casa entera:
   * el inventario se recarga al cambiar de condominio y el objeto quedaría
   * obsoleto.
   */
  selectedCasaId: string | null
  /** Sitio 3D (id de MODELOS_3D) abierto en su panel de información. */
  selectedModeloId: string | null
  setProvider: (p: MapProvider) => void
  setIluminacion: (i: Iluminacion) => void
  selectCasa: (casaId: string | null) => void
  selectModelo: (modeloId: string | null) => void
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      provider: 'mapbox',
      iluminacion: 'dia',
      selectedCasaId: null,
      selectedModeloId: null,
      setProvider: (p) => set({ provider: p }),
      setIluminacion: (i) => set({ iluminacion: i }),
      // Los dos paneles ocupan el mismo sitio: abrir uno cierra el otro.
      selectCasa: (casaId) =>
        set(casaId ? { selectedCasaId: casaId, selectedModeloId: null } : { selectedCasaId: null }),
      selectModelo: (modeloId) =>
        set(modeloId ? { selectedModeloId: modeloId, selectedCasaId: null } : { selectedModeloId: null }),
    }),
    {
      name: STORAGE_KEYS.provider,
      storage: createJSONStorage(() => sivirStorage),
      // Proveedor e iluminación se persisten; lo seleccionado es efímero.
      partialize: (state) => ({ provider: state.provider, iluminacion: state.iluminacion }),
    },
  ),
)
