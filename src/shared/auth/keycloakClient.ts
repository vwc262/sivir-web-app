// Cliente OIDC (Authorization Code + PKCE) contra Keycloak. Mismo patrón que el
// panel de administración. Solo se usa con VITE_AUTH_MODE=keycloak; en modo dev
// el módulo ni siquiera se carga (import dinámico desde el store).
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { CONFIG } from '../config'

export const userManager = new UserManager({
  authority: CONFIG.keycloak.authority,
  client_id: CONFIG.keycloak.clientId,
  redirect_uri: CONFIG.keycloak.redirectUri,
  post_logout_redirect_uri: CONFIG.keycloak.postLogoutRedirectUri,
  response_type: 'code',
  scope: CONFIG.keycloak.scope,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
})

/** Claims que el sitio necesita del perfil del token. */
export interface KeycloakClaims {
  sub: string
  username: string
  roles: string[]
  condominioId: string
}

/**
 * Normaliza el perfil del token. Los roles pueden venir en un claim propio o en
 * `realm_access.roles` (el sitio habitual en Keycloak); el condominio, en el
 * claim que también lee el hub.
 */
export function claimsFromProfile(profile: Record<string, unknown>): KeycloakClaims {
  const roles = extractRoles(profile)
  return {
    sub: String(profile.sub ?? ''),
    username: String(profile.preferred_username ?? profile.name ?? profile.sub ?? ''),
    roles,
    condominioId: String(profile[CONFIG.keycloak.condominioClaim] ?? ''),
  }
}

function extractRoles(profile: Record<string, unknown>): string[] {
  const own = profile[CONFIG.keycloak.rolesClaim]
  if (Array.isArray(own)) return own.map(String)

  const realmAccess = profile.realm_access as { roles?: unknown } | undefined
  if (Array.isArray(realmAccess?.roles)) return realmAccess.roles.map(String)

  return []
}
