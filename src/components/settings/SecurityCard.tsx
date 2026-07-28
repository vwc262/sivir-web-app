import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useSettingsStore } from '@/shared'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Toast } from '../ui/Toast'

export function SecurityCard() {
  const setPin = useSettingsStore((s) => s.setPin)
  const [modalOpen, setModalOpen] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const savePin = () => {
    if (newPin.trim().length < 4) return
    setPin(newPin.trim())
    setModalOpen(false)
    setNewPin('')
    setToast('PIN actualizado correctamente')
  }

  return (
    <Card title="Seguridad">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KeyRound size={18} className="text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">PIN de acceso</p>
            <p className="text-lg font-bold tracking-[0.3em]">••••••</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => setModalOpen(true)}>
          Cambiar PIN
        </Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Cambiar PIN">
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
          placeholder="Nuevo PIN (mín. 4 dígitos)"
          className="mb-4 w-full rounded-lg border border-border bg-bg-overlay px-3 py-2.5 text-center text-lg tracking-[0.3em] outline-none focus:border-accent-blue/50"
        />
        <Button className="w-full" disabled={newPin.trim().length < 4} onClick={savePin}>
          Guardar nuevo PIN
        </Button>
      </Modal>
      <Toast message={toast} onDone={() => setToast(null)} />
    </Card>
  )
}
