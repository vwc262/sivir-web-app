// Alertas en vivo recibidas del hub.
//
// No se persiste: son eventos del momento y el historial pertenece al core
// (Cassandra). Al recargar la página, la lista arranca vacía a propósito.

import { create } from 'zustand'
import type { ConnectionStatus, LiveAlert } from '../realtime/types'

/** Tope de alertas en memoria; más antiguas se descartan. */
const MAX_ALERTS = 100

interface AlertsState {
  alerts: LiveAlert[]
  status: ConnectionStatus
  /** Última alerta recibida, para el aviso emergente. */
  lastAlert: LiveAlert | null
  push: (alert: LiveAlert) => void
  markAllRead: () => void
  clear: () => void
  setStatus: (status: ConnectionStatus) => void
  dismissLast: () => void
}

export const useAlertsStore = create<AlertsState>((set) => ({
  alerts: [],
  status: 'idle',
  lastAlert: null,

  push: (alert) =>
    set((state) => {
      // El hub reenvía a todos los clientes del condominio; una reconexión puede
      // reentregar la misma alerta. Se descarta por id para no duplicar.
      if (state.alerts.some((a) => a.id === alert.id)) return state
      return {
        alerts: [alert, ...state.alerts].slice(0, MAX_ALERTS),
        lastAlert: alert,
      }
    }),

  markAllRead: () =>
    set((state) => ({ alerts: state.alerts.map((a) => (a.read ? a : { ...a, read: true })) })),

  clear: () => set({ alerts: [], lastAlert: null }),

  setStatus: (status) => set({ status }),

  dismissLast: () => set({ lastAlert: null }),
}))

/** Número de alertas sin leer, para el badge de la navegación. */
export const useUnreadAlertCount = (): number =>
  useAlertsStore((s) => s.alerts.reduce((total, a) => (a.read ? total : total + 1), 0))
