import { Building2, RefreshCw } from 'lucide-react'
import { useAuthStore, useCondominios } from '@/shared'

/**
 * Selector global de condominio: solo muestra el condominio activo. Lo fija el
 * claim del token de Keycloak, así que no se puede cambiar desde el sitio.
 */
export function CondominioSelector() {
  const { condominios, loading, error, reload } = useCondominios()
  const condominioId = useAuthStore((s) => s.session?.condominioId ?? '')

  if (error) {
    return (
      <button
        onClick={reload}
        className="flex items-center gap-2 rounded-lg border border-accent-red/40 bg-accent-red/10 px-2.5 py-1.5 text-xs text-accent-red cursor-pointer"
        title={error}
      >
        <RefreshCw size={13} />
        Sin conexión con el core
      </button>
    )
  }

  return (
    <label className="flex items-center gap-2 rounded-lg border border-border bg-black/20 px-2.5 py-1.5">
      <Building2 size={14} className="text-text-muted" />
      <select
        value={condominioId}
        disabled
        className="max-w-[190px] bg-transparent text-xs text-text-primary outline-none disabled:cursor-not-allowed"
        title="El condominio lo determina tu sesión de Keycloak"
      >
        {loading && <option value="">Cargando…</option>}
        {!loading && condominios.length === 0 && <option value="">Sin condominios</option>}
        {condominios.map((c) => (
          <option key={c.id} value={c.id} className="bg-bg-surface">
            {c.nombre}
          </option>
        ))}
      </select>
    </label>
  )
}
