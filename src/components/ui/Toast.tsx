import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2 } from 'lucide-react'

interface ToastProps {
  message: string | null
  onDone: () => void
}

export function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [message, onDone])

  if (!message) return null
  return createPortal(
    <div className="glass-card fixed bottom-20 left-1/2 z-110 flex -translate-x-1/2 items-center gap-2 bg-bg-surface/95 px-4 py-3 text-sm shadow-xl md:bottom-6">
      <CheckCircle2 size={16} className="text-emerald-400" />
      {message}
    </div>,
    document.body,
  )
}
