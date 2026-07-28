import { useState } from 'react'
import { useSettingsStore, type OperatorData } from '@/shared'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Toast } from '../ui/Toast'

const FIELDS: { key: keyof OperatorData; label: string }[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'unitId', label: 'ID de unidad' },
  { key: 'device', label: 'Dispositivo' },
]

export function OperatorCard() {
  const operator = useSettingsStore((s) => s.operator)
  const setOperator = useSettingsStore((s) => s.setOperator)
  const [data, setData] = useState<OperatorData>(operator)
  const [toast, setToast] = useState<string | null>(null)

  const save = () => {
    setOperator(data)
    setToast('Datos del operador guardados')
  }

  return (
    <Card title="Datos del Operador">
      <div className="space-y-3">
        {FIELDS.map(({ key, label }) => (
          <label key={key} className="block">
            <span className="mb-1 block text-xs text-text-muted">{label}</span>
            <input
              type="text"
              value={data[key]}
              onChange={(e) => setData((d) => ({ ...d, [key]: e.target.value }))}
              className="w-full rounded-lg border border-border bg-bg-overlay px-3 py-2 text-sm outline-none focus:border-accent-blue/50"
            />
          </label>
        ))}
        <Button variant="ghost" className="w-full" onClick={save}>
          Guardar cambios
        </Button>
      </div>
      <Toast message={toast} onDone={() => setToast(null)} />
    </Card>
  )
}
