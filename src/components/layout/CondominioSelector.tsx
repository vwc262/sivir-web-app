import { Building2, RefreshCw } from 'lucide-react'
import { useAuthStore, useCondominios, AUTH_MODE } from '@/shared'

/**
 * Selector global de condominio. Cambiarlo reemite el token de desarrollo y, con
 * él, la conexión al hub: el condominio es el canal de alertas.
 *
 * En modo keycloak el condominio lo fija el token, así que aquí solo se muestra.
 */
export function CondominioSelector() {
  const { condominios, loading, error, reload } = useCondominios()
  const condominioId = useAuthStore((s) => s.session?.condominioId ?? '')
  const setCondominio = useAuthStore((s) => s.setCondominio)
  const fijadoPorToken = AUTH_MODE === 'keycloak'

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
        disabled={fijadoPorToken || loading || condominios.length === 0}
        onChange={(e) => setCondominio(e.target.value)}
        className="max-w-[190px] bg-transparent text-xs text-text-primary outline-none disabled:cursor-not-allowed"
        title={fijadoPorToken ? 'El condominio lo determina tu sesión de Keycloak' : 'Condominio activo'}
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
