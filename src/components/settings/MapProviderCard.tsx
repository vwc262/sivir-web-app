import { Map as MapIcon, Globe2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { useMapStore, type MapProvider } from '@/shared'

const OPTIONS: {
  value: MapProvider
  label: string
  desc: string
  gradient: string
}[] = [
  {
    value: 'mapbox',
    label: 'Mapbox',
    desc: 'Estilo táctico personalizado',
    gradient: 'linear-gradient(135deg, #16213e 0%, #0f3460 60%, #1a1a2e 100%)',
  },
  {
    value: 'osm',
    label: 'OpenStreetMap',
    desc: 'Dark Matter (CARTO)',
    gradient: 'linear-gradient(135deg, #17171b 0%, #26262e 60%, #101013 100%)',
  },
]

export function MapProviderCard() {
  const provider = useMapStore((s) => s.provider)
  const setProvider = useMapStore((s) => s.setProvider)

  return (
    <Card title="Proveedor de Mapa">
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map(({ value, label, desc, gradient }) => (
          <button
            key={value}
            onClick={() => setProvider(value)}
            className={`overflow-hidden rounded-xl border text-left transition-all cursor-pointer ${
              provider === value
                ? 'border-accent-blue ring-2 ring-accent-blue/40'
                : 'border-border hover:border-white/20'
            }`}
          >
            <div
              className="flex h-20 items-center justify-center text-text-muted"
              style={{ background: gradient }}
            >
              {value === 'mapbox' ? <MapIcon size={24} /> : <Globe2 size={24} />}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-text-muted">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </Card>
  )
}
