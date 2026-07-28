// Obtención del access token para el core (cabecera Authorization) y para el
// hub (query param del handshake WebSocket).
//
// En modo keycloak la fuente de verdad es oidc-client-ts, que renueva el token
// en silencio; el store solo guarda una copia para la UI. En modo dev el token
// es el acuñado localmente.

import { AUTH_MODE } from '../config'
import { isSessionValid, useAuthStore } from '../store/useAuthStore'

export async function getAccessToken(): Promise<string | null> {
  if (AUTH_MODE === 'keycloak') {
    const { userManager } = await import('./keycloakClient')
    const user = await userManager.getUser()
    return user && !user.expired ? user.access_token : null
  }

  const session = useAuthStore.getState().session
  return isSessionValid(session) ? session.token : null
}
