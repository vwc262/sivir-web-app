import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { MapProvider, Unit } from '../types'
import { STORAGE_KEYS } from '../constants'
import { sivirStorage } from './storage'

interface MapState {
  provider: MapProvider
  selectedUnit: Unit | null
  setProvider: (p: MapProvider) => void
  selectUnit: (u: Unit | null) => void
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      provider: 'mapbox',
      selectedUnit: null,
      setProvider: (p) => set({ provider: p }),
      selectUnit: (u) => set({ selectedUnit: u }),
    }),
    {
      name: STORAGE_KEYS.provider,
      storage: createJSONStorage(() => sivirStorage),
      // Solo el proveedor se persiste; la unidad seleccionada es efímera.
      partialize: (state) => ({ provider: state.provider }),
    },
  ),
)
