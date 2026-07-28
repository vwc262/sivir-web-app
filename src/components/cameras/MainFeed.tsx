import { useEffect, useState } from 'react'
import { VideoOff, Loader2, WifiOff } from 'lucide-react'
import { HlsPlayer } from './HlsPlayer'
import type { StreamStatus } from './HlsPlayer'
import { getCameraStreamUrl } from '@/shared'

interface MainFeedProps {
  cameraId: number
  connected: boolean
}

export function MainFeed({ cameraId, connected }: MainFeedProps) {
  const [visible, setVisible] = useState(true)
  const [shown, setShown] = useState({ cameraId, connected })
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('connecting')

  useEffect(() => {
    if (cameraId === shown.cameraId) return
    setVisible(false)
    const t = setTimeout(() => {
      setShown({ cameraId, connected })
      setStreamStatus('connecting')
      setVisible(true)
    }, 300)
    return () => clearTimeout(t)
  }, [cameraId, connected, shown.cameraId])

  const streamUrl = getCameraStreamUrl(shown.cameraId)

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-[#0d0d10]" style={{ aspectRatio: '16 / 9' }}>
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {shown.connected ? (
          <>
            <HlsPlayer src={streamUrl} onStatusChange={setStreamStatus} />

            {streamStatus === 'playing' && (
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-md bg-black/50 px-3 py-1.5 text-xs font-semibold tracking-wider backdrop-blur-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent-red glow-red" />
                CÁMARA {shown.cameraId} — EN VIVO
              </div>
            )}

            {streamStatus === 'connecting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d0d10]/80 text-text-muted">
                <Loader2 size={32} className="animate-spin text-accent-blue" />
                <p className="text-sm font-medium">Conectando al stream…</p>
                <p className="max-w-full truncate px-6 font-mono text-xs">{streamUrl}</p>
              </div>
            )}

            {streamStatus === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d0d10] text-text-muted">
                <WifiOff size={36} className="text-accent-amber" />
                <p className="text-sm font-medium">Stream HLS no disponible</p>
                <p className="max-w-full truncate px-6 font-mono text-xs">{streamUrl}</p>
                <p className="px-6 text-center text-xs">
                  Verifica el servidor de streaming o ajusta la IP y el puerto en la configuración
                  (HLS_CONFIG / variables VITE_HLS_*).
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-text-muted">
            <VideoOff size={40} />
            <p className="text-sm font-medium">Sin señal</p>
            <p className="text-xs">Cámara {shown.cameraId} desconectada</p>
          </div>
        )}
      </div>
    </div>
  )
}
