import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { MapProvider } from '../types'
import { STORAGE_KEYS } from '../constants'
import { sivirStorage } from './storage'

interface MapState {
  provider: MapProvider
  /**
   * Casa abierta en el panel de detalle. Se guarda el id y no la casa entera:
   * el inventario se recarga al cambiar de condominio y el objeto quedaría
   * obsoleto.
   */
  selectedCasaId: string | null
  setProvider: (p: MapProvider) => void
  selectCasa: (casaId: string | null) => void
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      provider: 'mapbox',
      selectedCasaId: null,
      setProvider: (p) => set({ provider: p }),
      selectCasa: (casaId) => set({ selectedCasaId: casaId }),
    }),
    {
      name: STORAGE_KEYS.provider,
      storage: createJSONStorage(() => sivirStorage),
      // Solo el proveedor se persiste; la casa seleccionada es efímera.
      partialize: (state) => ({ provider: state.provider }),
    },
  ),
)
