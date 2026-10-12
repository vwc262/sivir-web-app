import { Sun, Sunset, Moon } from 'lucide-react'
import { Card } from '../ui/Card'
import { useMapStore, type Iluminacion } from '@/shared'

const OPTIONS: {
  value: Iluminacion
  label: string
  desc: string
  icon: typeof Sun
  gradient: string
}[] = [
  {
    value: 'dia',
    label: 'Día',
    desc: 'Luz blanca y sombras cortas',
    icon: Sun,
    gradient: 'linear-gradient(135deg, #2b4c7e 0%, #5b8bd0 60%, #a8c6f0 100%)',
  },
  {
    value: 'atardecer',
    label: 'Atardecer',
    desc: 'Luz cálida y sombras largas',
    icon: Sunset,
    gradient: 'linear-gradient(135deg, #3a1f4d 0%, #b8524a 60%, #f0a35e 100%)',
  },
  {
    value: 'noche',
    label: 'Noche',
    desc: 'Luz de luna, sin sombras',
    icon: Moon,
    gradient: 'linear-gradient(135deg, #070b18 0%, #142046 60%, #26386b 100%)',
  },
]

/**
 * Luz de la escena 3D del mapa. Afecta a los modelos y edificios en volumen,
 * no al color del mapa base, que depende del proveedor elegido arriba.
 */
export function LightingCard() {
  const iluminacion = useMapStore((s) => s.iluminacion)
  const setIluminacion = useMapStore((s) => s.setIluminacion)

  return (
    <Card title="Iluminación del Mapa">
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map(({ value, label, desc, icon: Icon, gradient }) => (
          <button
            key={value}
            onClick={() => setIluminacion(value)}
            className={`overflow-hidden rounded-xl border text-left transition-all cursor-pointer ${
              iluminacion === value
                ? 'border-accent-blue ring-2 ring-accent-blue/40'
                : 'border-border hover:border-white/20'
            }`}
          >
            <div
              className="flex h-20 items-center justify-center text-white/80"
              style={{ background: gradient }}
            >
              <Icon size={24} />
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
