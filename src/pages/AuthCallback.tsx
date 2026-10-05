// Retorno del flujo OIDC de Keycloak: canjea el authorization code y deja la
// sesión instalada en el store.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from 'oidc-client-ts'
import { useAuthStore } from '@/shared'

// El canje del code se hace una sola vez por carga de página. oidc-client-ts
// borra el `state` guardado al leerlo, y en desarrollo StrictMode monta el
// efecto dos veces: el segundo canje fallaría con "No matching state found in
// storage" mientras el primero —el bueno— se descartaba por cancelado. Ambos
// montajes esperan ahora la misma promesa.
let canje: Promise<User> | null = null

function canjearCode(): Promise<User> {
  canje ??= import('@/shared/auth/keycloakClient').then(({ userManager }) =>
    userManager.signinRedirectCallback(),
  )
  return canje
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Import dinámico: mantiene el cliente OIDC fuera del chunk inicial.
    void (async () => {
      try {
        const { claimsFromProfile } = await import('@/shared/auth/keycloakClient')
        const user = await canjearCode()
        if (cancelled) return

        const claims = claimsFromProfile(user.profile as unknown as Record<string, unknown>)
        setSession({
          userId: claims.sub,
          username: claims.username,
          roles: claims.roles,
          // El condominio viene firmado en el token: es el que el hub usará
          // para decidir qué alertas entrega.
          condominioId: claims.condominioId,
          token: user.access_token,
          expiresAt: (user.expires_at ?? 0) * 1000,
          loggedAt: new Date().toISOString(),
        })
        navigate('/dashboard/map', { replace: true })
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate, setSession])

  return (
    <div className="grid-bg flex min-h-full items-center justify-center bg-bg-deep p-4">
      {error ? (
        <div className="glass-card max-w-sm p-6 text-center">
          <p className="mb-1 text-sm font-semibold text-accent-red">Fallo de autenticación</p>
          <p className="text-xs text-text-muted">{error}</p>
        </div>
      ) : (
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
      )}
    </div>
  )
}
