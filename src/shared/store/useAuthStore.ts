// Sesión del sitio de monitoreo.
//
// Identidad, roles, condominio y access token, todos emitidos por Keycloak. El
// condominio viaja firmado en el claim del token —es lo que el hub usa para
// decidir qué canal de alertas entrega—, así que el sitio no puede cambiarlo.

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORAGE_KEYS } from '../constants'
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
  loggedAt: string
}

interface AuthState {
  session: Session | null
  /** Redirige al proveedor de identidad (Keycloak). */
  login: () => Promise<void>
  /** Cierra la sesión de Keycloak. */
  logout: () => Promise<void>
  /** El condominio lo fija el token; no hay forma de cambiarlo desde el sitio. */
  setCondominio: (condominioId: string) => void
  /** Instala una sesión ya resuelta (callback de Keycloak). */
  setSession: (session: Session) => void
}

/** Indica si la sesión existe y su token sigue vigente. */
export function isSessionValid(session: Session | null): session is Session {
  return session !== null && session.expiresAt > Date.now()
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,

      login: async () => {
        const { userManager } = await import('../auth/keycloakClient')
        await userManager.signinRedirect()
      },

      logout: async () => {
        set({ session: null })
        const { userManager } = await import('../auth/keycloakClient')
        await userManager.signoutRedirect()
      },

      setCondominio: () => {
        // El condominio viaja firmado en el token: cambiarlo aquí
        // desincronizaría el sitio del canal que sirve el hub.
        console.warn('[auth] el condominio lo fija el token de Keycloak; no se cambia en el sitio')
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
