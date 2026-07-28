import { useState } from 'react'
import { MainFeed } from '@/components/cameras/MainFeed'
import { CameraGrid } from '@/components/cameras/CameraGrid'
import { CAMERA_STATUS } from '@/shared'

export default function CamerasPage() {
  const [activeCamera, setActiveCamera] = useState(1)

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <h1 className="text-lg font-semibold">Videovigilancia</h1>
      <MainFeed cameraId={activeCamera} connected={CAMERA_STATUS[activeCamera] ?? false} />
      <CameraGrid activeCamera={activeCamera} onSelect={setActiveCamera} />
    </div>
  )
}
