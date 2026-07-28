import { useMapStore, type MapProvider } from '@/shared'

const OPTIONS: { value: MapProvider; label: string }[] = [
  { value: 'mapbox', label: 'Mapbox' },
  { value: 'osm', label: 'OSM' },
]

export function ProviderToggle() {
  const provider = useMapStore((s) => s.provider)
  const setProvider = useMapStore((s) => s.setProvider)

  return (
    <div className="glass-card absolute bottom-6 left-4 z-10 flex gap-1 bg-bg-surface/80 p-1">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setProvider(value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            provider === value
              ? 'bg-accent-blue text-white'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
