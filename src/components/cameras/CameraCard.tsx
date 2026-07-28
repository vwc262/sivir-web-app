import { Video, VideoOff } from 'lucide-react'
import type { Camara } from '@/shared'

interface CameraCardProps {
  camara: Camara
  active: boolean
  onSelect: (camara: Camara) => void
}

function StatusLED({ on }: { on: boolean }) {
  return (
    <span
      className="h-2 w-2 rounded-full"
      style={{
        background: on ? '#22c55e' : '#ef4444',
        boxShadow: `0 0 6px ${on ? '#22c55e' : '#ef4444'}`,
      }}
    />
  )
}

export function CameraCard({ camara, active, onSelect }: CameraCardProps) {
  return (
    <button
      onClick={() => onSelect(camara)}
      title={camara.nombre}
      className={`glass-card relative flex flex-col items-center justify-center gap-2 bg-[#0d0d10] px-2 py-5 transition-all cursor-pointer hover:bg-white/5 ${
        active ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{ aspectRatio: '16 / 10' }}
    >
      <span className="absolute top-2 right-2">
        <StatusLED on={camara.enabled} />
      </span>
      {camara.enabled ? (
        <Video size={22} className="text-text-muted" />
      ) : (
        <VideoOff size={22} className="text-text-muted/50" />
      )}
      <span
        className={`max-w-full truncate text-xs font-medium ${camara.enabled ? '' : 'text-text-muted'}`}
      >
        {camara.nombre}
      </span>
    </button>
  )
}
