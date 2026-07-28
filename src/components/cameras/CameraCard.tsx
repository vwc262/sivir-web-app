import { Video, VideoOff } from 'lucide-react'

interface CameraCardProps {
  cameraId: number
  connected: boolean
  active: boolean
  onSelect: (id: number) => void
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

export function CameraCard({ cameraId, connected, active, onSelect }: CameraCardProps) {
  return (
    <button
      onClick={() => onSelect(cameraId)}
      className={`glass-card relative flex flex-col items-center justify-center gap-2 bg-[#0d0d10] py-5 transition-all cursor-pointer hover:bg-white/5 ${
        active ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{ aspectRatio: '16 / 10' }}
    >
      <span className="absolute top-2 right-2">
        <StatusLED on={connected} />
      </span>
      {connected ? (
        <Video size={22} className="text-text-muted" />
      ) : (
        <VideoOff size={22} className="text-text-muted/50" />
      )}
      <span className={`text-xs font-medium ${connected ? '' : 'text-text-muted'}`}>
        CAM {cameraId}
      </span>
    </button>
  )
}
