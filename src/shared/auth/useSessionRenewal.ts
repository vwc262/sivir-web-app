// Mantiene la sesión del store al día con el token que renueva oidc-client-ts.
//
// oidc-client-ts renueva el access token en segundo plano
// (`automaticSilentRenew`), pero la sesión del store guardaba la caducidad del
// primer token y nunca la actualizaba: al vencer ese primero, useSession la
// daba por cerrada y el layout devolvía al login cada pocos minutos, con la
// sesión de Keycloak todavía viva.
//
// Se monta una sola vez, en el layout del dashboard.

import { useEffect, useState } from 'react'
import type { User } from 'oidc-client-ts'
import { isSessionValid, useAuthStore } from '../store/useAuthStore'

/** Copia en la sesión el token vigente; el resto de la sesión no cambia. */
function sincronizar(user: User): void {
  const { session, setSession } = useAuthStore.getState()
  if (!session) return
  setSession({ ...session, token: user.access_token, expiresAt: (user.expires_at ?? 0) * 1000 })
}

// Una sola recuperación por carga de página: en desarrollo StrictMode monta el
// efecto dos veces, y dos renovaciones simultáneas con el mismo refresh token
// pueden invalidarse entre sí si Keycloak los rota.
let recuperacion: Promise<User | null> | null = null

/**
 * Token vigente al abrir la página. Si el guardado ya venció, se intenta
 * renovar con el refresh token antes de dar la sesión por perdida.
 */
function recuperarUsuario(): Promise<User | null> {
  recuperacion ??= import('./keycloakClient').then(async ({ userManager }) => {
    const user = await userManager.getUser()
    if (user && !user.expired) return user
    if (!user) return null
    return userManager.signinSilent().catch(() => null)
  })
  return recuperacion
}

/**
 * Devuelve true mientras se comprueba si una sesión guardada pero vencida se
 * puede renovar. Durante ese rato el layout no debe redirigir al login.
 */
export function useSessionRenewal(): boolean {
  const [verificando, setVerificando] = useState(() => {
    const session = useAuthStore.getState().session
    return session !== null && !isSessionValid(session)
  })

  useEffect(() => {
    let cancelado = false
    let quitarSuscripcion: (() => void) | undefined

    void (async () => {
      const { userManager } = await import('./keycloakClient')
      if (cancelado) return
      // addUserLoaded devuelve la función que retira la suscripción.
      quitarSuscripcion = userManager.events.addUserLoaded(sincronizar)

      const user = await recuperarUsuario()
      if (cancelado) return
      if (user && !user.expired) {
        sincronizar(user)
      } else if (useAuthStore.getState().session) {
        // Ni el token guardado ni la renovación sirven: la sesión de Keycloak
        // terminó de verdad. Se limpia la local para que el login vuelva a
        // empezar en limpio.
        useAuthStore.setState({ session: null })
      }
      setVerificando(false)
    })()

    return () => {
      cancelado = true
      quitarSuscripcion?.()
    }
  }, [])

  return verificando
}
