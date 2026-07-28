import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { VideoOff, Loader2, WifiOff, MonitorOff } from 'lucide-react'
import { HlsPlayer } from './HlsPlayer'
import type { StreamStatus } from './HlsPlayer'
import type { Camara } from '@/shared'

interface MainFeedProps {
  camara: Camara | null
}

export function MainFeed({ camara }: MainFeedProps) {
  const [visible, setVisible] = useState(true)
  const [shown, setShown] = useState<Camara | null>(camara)
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('connecting')

  // Cambio de cámara con un fundido corto: da tiempo a desmontar el reproductor
  // anterior antes de montar el siguiente.
  useEffect(() => {
    if (camara?.id === shown?.id) return
    setVisible(false)
    const t = setTimeout(() => {
      setShown(camara)
      setStreamStatus('connecting')
      setVisible(true)
    }, 300)
    return () => clearTimeout(t)
  }, [camara, shown?.id])

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border bg-[#0d0d10]"
      style={{ aspectRatio: '16 / 9' }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <FeedContent camara={shown} streamStatus={streamStatus} onStatusChange={setStreamStatus} />
      </div>
    </div>
  )
}

interface FeedContentProps {
  camara: Camara | null
  streamStatus: StreamStatus
  onStatusChange: (status: StreamStatus) => void
}

function FeedContent({ camara, streamStatus, onStatusChange }: FeedContentProps) {
  if (!camara) {
    return <Placeholder icon={<VideoOff size={40} />} title="Selecciona una cámara" />
  }

  if (!camara.enabled) {
    return (
      <Placeholder
        icon={<VideoOff size={40} />}
        title="Cámara deshabilitada"
        detail={`${camara.nombre} está dada de baja en el inventario`}
      />
    )
  }

  // Sin URL, el core no tiene configurado el video-edge: no es que el stream
  // falle, es que no hay a dónde conectarse.
  if (!camara.hlsUrl) {
    return (
      <Placeholder
        icon={<MonitorOff size={40} className="text-accent-amber" />}
        title="Sin nodo de vídeo configurado"
        detail="Define VIDEO_EDGE_BASE_URL en el core para reproducir las cámaras"
      />
    )
  }

  return (
    <>
      <HlsPlayer src={camara.hlsUrl} onStatusChange={onStatusChange} />

      {streamStatus === 'playing' && (
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-md bg-black/50 px-3 py-1.5 text-xs font-semibold tracking-wider backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent-red glow-red" />
          {camara.nombre.toUpperCase()} — EN VIVO
        </div>
      )}

      {streamStatus === 'connecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d0d10]/80 text-text-muted">
          <Loader2 size={32} className="animate-spin text-accent-blue" />
          <p className="text-sm font-medium">Conectando al stream…</p>
          <p className="max-w-full truncate px-6 font-mono text-xs">{camara.hlsUrl}</p>
        </div>
      )}

      {streamStatus === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d0d10] text-text-muted">
          <WifiOff size={36} className="text-accent-amber" />
          <p className="text-sm font-medium">Stream HLS no disponible</p>
          <p className="max-w-full truncate px-6 font-mono text-xs">{camara.hlsUrl}</p>
          <p className="px-6 text-center text-xs">
            La cámara está en el inventario, pero el video-edge no está publicando el flujo{' '}
            <span className="font-mono">{camara.streamId || camara.id}</span>.
          </p>
        </div>
      )}
    </>
  )
}

function Placeholder({
  icon,
  title,
  detail,
}: {
  icon: ReactNode
  title: string
  detail?: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 text-center text-text-muted">
      {icon}
      <p className="text-sm font-medium">{title}</p>
      {detail && <p className="text-xs">{detail}</p>}
    </div>
  )
}
