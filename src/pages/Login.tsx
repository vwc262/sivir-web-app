import { Navigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuthStore, useSession } from '@/shared'

export default function Login() {
  const session = useSession()
  const login = useAuthStore((s) => s.login)

  if (session) return <Navigate to="/dashboard/map" replace />

  return (
    <div className="grid-bg flex min-h-full items-center justify-center bg-bg-deep p-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-border p-8"
        style={{
          backdropFilter: 'blur(20px)',
          background: 'rgba(255,255,255,0.05)',
        }}
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="glow-blue flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-blue/15 text-accent-blue">
            <ShieldCheck size={28} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-wide">SIVIR</h1>
            <p className="text-xs text-text-muted">Sistema de Comando Táctico</p>
          </div>
        </div>

        <p className="mb-6 text-center text-xs text-text-muted">
          El acceso se valida en Keycloak. Serás redirigido al proveedor de identidad.
        </p>
        <button
          type="button"
          onClick={() => void login()}
          className="btn-shimmer w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 cursor-pointer"
        >
          Acceder con Keycloak
        </button>
      </div>
    </div>
  )
}
