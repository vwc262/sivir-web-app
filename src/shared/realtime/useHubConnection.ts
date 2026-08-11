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
import { useChatStore } from '../store/useChatStore'
import { HubClient, registrarHub } from './hubClient'
import { asChatMessage, asDeviceSnapshot, asDeviceState, toLiveAlert } from './types'

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

    // getToken (no un token fijo): el cliente lo llama en cada conexión y
    // reconexión, incluidas las que dispara el propio hub al avisar que la
    // sesión está por vencer o ya venció.
    const client = new HubClient({
      url: CONFIG.hubWsUrl,
      getToken: getAccessToken,
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
        if (estado && estado.condominio_id === condominioId) {
          aplicar(estado)
          return
        }

        const mensaje = asChatMessage(raw)
        if (mensaje) useChatStore.getState().recibir(mensaje)
      },
    })
    client.connect()
    registrarHub(client)

    return () => {
      registrarHub(null)
      client.close()
    }
  }, [userId, condominioId])
}
