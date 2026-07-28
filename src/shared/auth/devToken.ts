// Acuñación de tokens de DESARROLLO.
//
// El realtime-hub en `HUB_AUTH_MODE=dev` lee los claims del JWT sin verificar la
// firma (ParseUnverified), pero sigue exigiendo un JWT bien formado con `sub` y
// `condominio_id`: sin ese último claim rechaza el handshake, porque es lo que
// determina a qué canal de alertas se suscribe la conexión.
//
// Por eso el bypass del sitio no puede ser un marcador cualquiera: tiene que ser
// un token real. Es el equivalente en el navegador de `tools/devtoken` del hub.
//
// ⚠️ La firma es un relleno sin valor criptográfico. Solo sirve con los servicios
// en modo dev; en producción los tokens los emite Keycloak.

import { CONFIG } from '../config'

/** Vigencia del token de desarrollo. */
const DEV_TOKEN_TTL_SECONDS = 8 * 60 * 60

export interface DevIdentity {
  userId: string
  username: string
  roles: string[]
  condominioId: string
}

/** base64url sin relleno, que es la codificación de las partes de un JWT. */
function base64Url(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Genera un JWT de desarrollo con los claims que exigen el hub y el core. */
export function mintDevToken(identity: DevIdentity): { token: string; expiresAt: number } {
  const issuedAt = Math.floor(Date.now() / 1000)
  const expiresAt = issuedAt + DEV_TOKEN_TTL_SECONDS

  const header = { alg: 'HS256', typ: 'JWT' }
  const payload: Record<string, unknown> = {
    sub: identity.userId,
    preferred_username: identity.username,
    [CONFIG.keycloak.condominioClaim]: identity.condominioId,
    [CONFIG.keycloak.rolesClaim]: identity.roles,
    iat: issuedAt,
    exp: expiresAt,
  }

  // Firma de relleno: el hub en modo dev no la verifica, pero el token debe
  // tener las tres partes para poder parsearse.
  const signature = base64Url('sivir-dev-no-verificada')
  const token = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}.${signature}`

  return { token, expiresAt: expiresAt * 1000 }
}
