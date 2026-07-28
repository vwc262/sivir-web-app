import { useEffect, useState } from 'react'
import { VideoOff } from 'lucide-react'
import { MainFeed } from '@/components/cameras/MainFeed'
import { CameraGrid } from '@/components/cameras/CameraGrid'
import { useCamaras, type Camara } from '@/shared'

export default function CamerasPage() {
  const { grupos, camaras, loading, error } = useCamaras()
  const [activeId, setActiveId] = useState<string | null>(null)

  // La selección se guarda por id y no por objeto: al recargar el inventario
  // los objetos cambian de identidad y la cámara elegida se perdería.
  const activa = camaras.find((c) => c.id === activeId) ?? null

  useEffect(() => {
    if (camaras.length === 0) {
      setActiveId(null)
      return
    }
    // Preseleccionar la primera cámara habilitada; si no hay ninguna, la primera.
    if (!camaras.some((c) => c.id === activeId)) {
      setActiveId((camaras.find((c) => c.enabled) ?? camaras[0]).id)
    }
  }, [camaras, activeId])

  const seleccionar = (camara: Camara) => setActiveId(camara.id)

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <h1 className="text-lg font-semibold">Videovigilancia</h1>

      {error && (
        <p className="rounded-lg border border-accent-red/40 bg-accent-red/10 px-3 py-2 text-xs text-accent-red">
          {error}
        </p>
      )}

      <MainFeed camara={activa} />

      {loading && <p className="text-xs text-text-muted">Cargando inventario de cámaras…</p>}

      {!loading && !error && camaras.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-2 p-8 text-center text-text-muted">
          <VideoOff size={28} />
          <p className="text-sm font-medium">Este condominio no tiene cámaras registradas</p>
          <p className="text-xs">Se dan de alta desde el panel de administración.</p>
        </div>
      )}

      {grupos.length > 0 && (
        <CameraGrid grupos={grupos} activeCamera={activa} onSelect={seleccionar} />
      )}
    </div>
  )
}
