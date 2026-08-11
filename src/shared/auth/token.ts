// Obtención del access token para el core (cabecera Authorization) y para el
// hub (query param del handshake WebSocket).
//
// La fuente de verdad es oidc-client-ts, que renueva el token en silencio; el
// store solo guarda una copia para la UI.

export async function getAccessToken(): Promise<string | null> {
  const { userManager } = await import('./keycloakClient')
  const user = await userManager.getUser()
  return user && !user.expired ? user.access_token : null
}
