import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { OperatorData } from '../types'
import { STORAGE_KEYS } from '../constants'
import { sivirStorage } from './storage'

const DEFAULT_OPERATOR: OperatorData = {
  name: 'Operador Central',
  unitId: 'SIVIR-01',
  device: 'Consola de Comando',
}

interface SettingsState {
  visible: boolean
  operator: OperatorData
  pin: string
  setVisible: (v: boolean) => void
  setOperator: (o: OperatorData) => void
  setPin: (p: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      visible: true,
      operator: DEFAULT_OPERATOR,
      pin: '',
      setVisible: (v) => set({ visible: v }),
      setOperator: (o) => set({ operator: o }),
      setPin: (p) => set({ pin: p }),
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: createJSONStorage(() => sivirStorage),
    },
  ),
)
