import { CAMERA_STATUS } from '@/shared'
import { CameraCard } from './CameraCard'

interface CameraGridProps {
  activeCamera: number
  onSelect: (id: number) => void
}

export function CameraGrid({ activeCamera, onSelect }: CameraGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
      {Object.entries(CAMERA_STATUS).map(([id, connected]) => (
        <CameraCard
          key={id}
          cameraId={Number(id)}
          connected={connected}
          active={Number(id) === activeCamera}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
