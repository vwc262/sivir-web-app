import { Home } from 'lucide-react'
import type { Camara, CasaConCamaras } from '@/shared'
import { CameraCard } from './CameraCard'

interface CameraGridProps {
  grupos: CasaConCamaras[]
  activeCamera: Camara | null
  onSelect: (camara: Camara) => void
}

/** Cámaras del condominio, agrupadas por la casa donde están instaladas. */
export function CameraGrid({ grupos, activeCamera, onSelect }: CameraGridProps) {
  return (
    <div className="flex flex-col gap-5">
      {grupos.map(({ casa, camaras }) => (
        <section key={casa.id}>
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-text-muted uppercase">
            <Home size={13} />
            Casa {casa.identificador}
            <span className="font-normal normal-case">
              · {camaras.length} {camaras.length === 1 ? 'cámara' : 'cámaras'}
            </span>
          </h2>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {camaras.map((camara) => (
              <CameraCard
                key={camara.id}
                camara={camara}
                active={camara.id === activeCamera?.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
