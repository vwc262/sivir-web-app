import { useMapStore, type MapProvider } from '@/shared'

const OPTIONS: { value: MapProvider; label: string }[] = [
  { value: 'mapbox', label: 'Mapbox' },
  { value: 'osm', label: 'OSM' },
]

export function ProviderToggle() {
  const provider = useMapStore((s) => s.provider)
  const setProvider = useMapStore((s) => s.setProvider)

  return (
    // Opaco y con borde: sobre edificios en 3D, un fondo translúcido se pierde.
    <div className="absolute bottom-6 left-4 z-10 flex gap-1 rounded-xl border border-white/15 bg-bg-surface p-1 shadow-xl shadow-black/50">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setProvider(value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            provider === value
              ? 'bg-accent-blue text-white'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
