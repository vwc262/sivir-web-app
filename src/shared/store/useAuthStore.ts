// Sesión del sitio de monitoreo.
//
// La sesión es la misma en los dos modos de autenticación: identidad, roles,
// condominio y un access token. Lo que cambia es de dónde sale el token
// —acuñado localmente en modo dev, emitido por Keycloak en producción— y quién
// manda sobre el condominio: en dev lo elige el operador; en keycloak lo fija el
// claim del token, que es lo que el hub usa para decidir qué alertas entrega, así
// que el sitio no puede contradecirlo.

import { create } from 'zustand'
import { apiList } from '../api/http'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AUTH_MODE, type AuthMode } from '../config'
import { ROLES, STORAGE_KEYS } from '../constants'
import { mintDevToken } from '../auth/devToken'
import { sivirStorage } from './storage'

export interface Session {
  userId: string
  username: string
  roles: string[]
  /** Condominio activo: filtra las consultas al core y el canal de alertas. */
  condominioId: string
  token: string
  /** Caducidad del token en epoch ms. */
  expiresAt: number
  mode: AuthMode
  loggedAt: string
}

export interface LoginParams {
  username: string
  role?: string
  condominioId?: string
}

interface AuthState {
  session: Session | null
  /** Modo dev: acuña la sesión local. Modo keycloak: redirige al proveedor. */
  login: (params: LoginParams) => Promise<void>
  /** Cierra la sesión (y la de Keycloak si aplica). */
  logout: () => Promise<void>
  /** Cambia el condominio activo; en modo dev vuelve a acuñar el token. */
  setCondominio: (condominioId: string) => void
  /** Instala una sesión ya resuelta (callback de Keycloak). */
  setSession: (session: Session) => void
}

/**
 * Busca el identificador de un usuario por su nombre.
 *
 * Solo en modo dev: si el core no responde o el nombre no existe se sigue
 * adelante con un identificador inventado, porque el bypass debe funcionar
 * aunque no haya backend —solo que entonces el usuario no pertenece a ninguna
 * sala ni tiene dispositivos—.
 */
async function buscarUsuario(username: string): Promise<string | null> {
  try {
    const { data } = await apiList<{ id: string; username: string }>('/usuarios', {
      username,
      _start: 0,
      _end: 1,
    })
    return data[0]?.id ?? null
  } catch {
    return null
  }
}

/** Indica si la sesión existe y su token sigue vigente. */
export function isSessionValid(session: Session | null): session is Session {
  return session !== null && session.expiresAt > Date.now()
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,

      login: async ({ username, role = ROLES.cliente, condominioId = '' }) => {
        if (AUTH_MODE === 'keycloak') {
          const { userManager } = await import('../auth/keycloakClient')
          await userManager.signinRedirect()
          return
        }

        // La identidad de desarrollo se ata a un usuario real del dominio
        // cuando el nombre coincide con uno dado de alta. Importa: las salas de
        // chat, las membresías y los dispositivos cuelgan de ese identificador,
        // y con uno inventado el usuario no pertenecería a nada.
        const userId = (await buscarUsuario(username)) ?? `dev-${username}`
        const { token, expiresAt } = mintDevToken({ userId, username, roles: [role], condominioId })
        set({
          session: {
            userId,
            username,
            roles: [role],
            condominioId,
            token,
            expiresAt,
            mode: 'dev',
            loggedAt: new Date().toISOString(),
          },
        })
      },

      logout: async () => {
        const mode = get().session?.mode
        set({ session: null })
        if (mode === 'keycloak') {
          const { userManager } = await import('../auth/keycloakClient')
          await userManager.signoutRedirect()
        }
      },

      setCondominio: (condominioId) => {
        const session = get().session
        if (!session || session.condominioId === condominioId) return

        // En modo keycloak el condominio viaja firmado en el token: cambiarlo
        // aquí desincronizaría el sitio del canal que sirve el hub.
        if (session.mode === 'keycloak') {
          console.warn('[auth] el condominio lo fija el token de Keycloak; no se cambia en el sitio')
          return
        }

        const { token, expiresAt } = mintDevToken({
          userId: session.userId,
          username: session.username,
          roles: session.roles,
          condominioId,
        })
        set({ session: { ...session, condominioId, token, expiresAt } })
      },

      setSession: (session) => set({ session }),
    }),
    {
      name: STORAGE_KEYS.session,
      storage: createJSONStorage(() => sivirStorage),
    },
  ),
)

/** La sesión solo si sigue vigente; si caducó, es como no tenerla. */
export const useSession = (): Session | null => {
  const session = useAuthStore((s) => s.session)
  return isSessionValid(session) ? session : null
}

/** Condominio activo, o cadena vacía si aún no se ha elegido. */
export const useCondominioId = (): string => useAuthStore((s) => s.session?.condominioId ?? '')
