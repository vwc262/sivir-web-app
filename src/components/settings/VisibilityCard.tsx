import { Eye, EyeOff } from 'lucide-react'
import { useSettingsStore } from '@/shared'
import { Card } from '../ui/Card'
import { Toggle } from '../ui/Toggle'

export function VisibilityCard() {
  const visible = useSettingsStore((s) => s.visible)
  const setVisible = useSettingsStore((s) => s.setVisible)

  return (
    <Card title="Estado de Visibilidad">
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${
            visible ? 'text-emerald-400' : 'text-text-muted'
          }`}
        >
          {visible ? <Eye size={18} /> : <EyeOff size={18} />}
          {visible ? 'Visible' : 'Invisible'}
        </div>
        <Toggle checked={visible} onChange={setVisible} />
      </div>
      <p className="mt-3 text-xs text-text-muted">
        Cuando estás invisible, tu posición no se comparte con el resto de las unidades.
      </p>
    </Card>
  )
}
