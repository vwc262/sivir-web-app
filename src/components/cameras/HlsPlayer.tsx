import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

export type StreamStatus = 'connecting' | 'playing' | 'error'

interface HlsPlayerProps {
  src: string
  onStatusChange: (status: StreamStatus) => void
}

export function HlsPlayer({ src, onStatusChange }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const statusRef = useRef(onStatusChange)
  statusRef.current = onStatusChange

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    statusRef.current('connecting')
    const handlePlaying = () => statusRef.current('playing')
    video.addEventListener('playing', handlePlaying)

    let hls: Hls | null = null

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      const handleError = () => statusRef.current('error')
      video.addEventListener('error', handleError)
      video.src = src
      void video.play().catch(() => statusRef.current('error'))
      return () => {
        video.removeEventListener('playing', handlePlaying)
        video.removeEventListener('error', handleError)
        video.removeAttribute('src')
        video.load()
      }
    }

    if (Hls.isSupported()) {
      hls = new Hls({
        lowLatencyMode: true,
        manifestLoadingMaxRetry: 1,
        manifestLoadingTimeOut: 8000,
        levelLoadingMaxRetry: 2,
        fragLoadingMaxRetry: 2,
      })
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => statusRef.current('error'))
      })
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          statusRef.current('error')
          hls?.destroy()
          hls = null
        }
      })
      hls.loadSource(src)
      hls.attachMedia(video)
    } else {
      statusRef.current('error')
    }

    return () => {
      video.removeEventListener('playing', handlePlaying)
      hls?.destroy()
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      autoPlay
      className="absolute inset-0 h-full w-full object-contain"
    />
  )
}
