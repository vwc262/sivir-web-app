// Configuración del sitio por variables de entorno (Vite: prefijo VITE_).
//
// Nada de lo que dependa del despliegue —dónde vive el core, dónde vive el hub,
// el token de Mapbox— debe estar escrito en el código: el mismo build se
// promueve entre entornos cambiando solo el `.env`. Ver `.env.example`.

/** Modo de autenticación, mismo bypass de desarrollo que el resto de la plataforma. */
export type AuthMode = 'dev' | 'keycloak'

const origin = typeof window !== 'undefined' ? window.location.origin : ''

/** Lee una variable con valor por defecto, ignorando cadenas vacías. */
function envVar(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

export const AUTH_MODE: AuthMode =
  import.meta.env.VITE_AUTH_MODE === 'keycloak' ? 'keycloak' : 'dev'

export const CONFIG = {
  /** sivir-rest-core: dominio, telemetría e historial de chat. */
  coreUrl: envVar(import.meta.env.VITE_CORE_URL, 'http://localhost:8082').replace(/\/+$/, ''),

  /** sivir-realtime-hub: WebSocket de alertas en vivo. */
  hubWsUrl: envVar(import.meta.env.VITE_HUB_WS_URL, 'ws://localhost:8080/ws'),

  authMode: AUTH_MODE,

  keycloak: {
    authority: envVar(import.meta.env.VITE_KEYCLOAK_AUTHORITY, ''),
    clientId: envVar(import.meta.env.VITE_KEYCLOAK_CLIENT_ID, 'sivir-web-app'),
    redirectUri: envVar(import.meta.env.VITE_KEYCLOAK_REDIRECT_URI, `${origin}/auth/callback`),
    postLogoutRedirectUri: envVar(
      import.meta.env.VITE_KEYCLOAK_POST_LOGOUT_REDIRECT_URI,
      `${origin}/`,
    ),
    scope: envVar(import.meta.env.VITE_KEYCLOAK_SCOPE, 'openid profile email'),
    /**
     * Claim del token que porta el condominio del usuario. Tiene que coincidir
     * con HUB_CONDOMINIO_CLAIM del hub: es lo que decide a qué canal de alertas
     * se suscribe la conexión.
     */
    condominioClaim: envVar(import.meta.env.VITE_CONDOMINIO_CLAIM, 'condominio_id'),
    rolesClaim: envVar(import.meta.env.VITE_ROLES_CLAIM, 'roles'),
  },

  mapbox: {
    token: envVar(import.meta.env.VITE_MAPBOX_TOKEN, ''),
    style: envVar(
      import.meta.env.VITE_MAPBOX_STYLE,
      'mapbox://styles/mapbox/dark-v11',
    ),
  },
} as const

/**
 * Mapbox solo se puede usar con token. Sin él, el sitio cae al proveedor OSM en
 * lugar de mostrar un mapa en blanco.
 */
export const MAPBOX_ENABLED = CONFIG.mapbox.token !== ''
