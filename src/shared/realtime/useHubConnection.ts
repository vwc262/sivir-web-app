// Mantiene viva la conexión con el hub mientras haya sesión y condominio.
//
// Se monta una sola vez, en el layout del dashboard: dos montajes darían dos
// conexiones y cada alerta llegaría por duplicado.

import { useEffect } from 'react'
import { CONFIG } from '../config'
import { getAccessToken } from '../auth/token'
import { useAlertsStore } from '../store/useAlertsStore'
import { useAuthStore } from '../store/useAuthStore'
import { useDevicesStore } from '../store/useDevicesStore'
import { HubClient } from './hubClient'
import { asDeviceSnapshot, asDeviceState, toLiveAlert } from './types'

export function useHubConnection(): void {
  const userId = useAuthStore((s) => s.session?.userId ?? '')
  const condominioId = useAuthStore((s) => s.session?.condominioId ?? '')

  useEffect(() => {
    const { setStatus, push, clear } = useAlertsStore.getState()
    const { aplicar, aplicarVarios, limpiar } = useDevicesStore.getState()

    // Alertas y dispositivos son del condominio que se está monitoreando: al
    // cambiar de condominio, dejar los anteriores en pantalla induciría a error.
    clear()
    limpiar()

    // Sin condominio no hay canal al que suscribirse: el hub rechaza el
    // handshake si el token no lo porta.
    if (!userId || !condominioId) {
      setStatus('idle')
      return
    }

    let client: HubClient | null = null
    let cancelled = false

    void getAccessToken().then((token) => {
      if (cancelled) return
      if (!token) {
        setStatus('offline')
        return
      }

      client = new HubClient({
        url: CONFIG.hubWsUrl,
        token,
        onStatus: setStatus,
        onMessage: (raw) => {
          // Por la misma conexión llegan dos cosas: alertas y estado de los
          // dispositivos. Se reparten por tipo.
          const alert = toLiveAlert(raw)
          if (alert) {
            // El hub ya segmenta por condominio; el filtro es una salvaguarda
            // por si llega algo de otro canal tras un cambio de condominio.
            if (alert.condominioId === condominioId) push(alert)
            return
          }

          const snapshot = asDeviceSnapshot(raw)
          if (snapshot) {
            aplicarVarios(snapshot.devices)
            return
          }

          const estado = asDeviceState(raw)
          if (estado && estado.condominio_id === condominioId) aplicar(estado)
        },
      })
      client.connect()
    })

    return () => {
      cancelled = true
      client?.close()
    }
  }, [userId, condominioId])
}
