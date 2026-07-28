// Retorno del flujo OIDC de Keycloak: canjea el authorization code y deja la
// sesión instalada en el store. Solo se usa con VITE_AUTH_MODE=keycloak.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/shared'

export default function AuthCallback() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Import dinámico: el cliente OIDC no debe entrar en el bundle en modo dev.
    void (async () => {
      try {
        const { userManager, claimsFromProfile } = await import('@/shared/auth/keycloakClient')
        const user = await userManager.signinRedirectCallback()
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
          mode: 'keycloak',
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
