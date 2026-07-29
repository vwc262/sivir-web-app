import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, Users } from 'lucide-react'
import { initials, useAuthStore, useChatStore, useMensajesActivos } from '@/shared'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'

interface ChatWindowProps {
  onBack?: () => void
  className?: string
}

export function ChatWindow({ onBack, className = '' }: ChatWindowProps) {
  const salas = useChatStore((s) => s.salas)
  const salaActiva = useChatStore((s) => s.salaActiva)
  const error = useChatStore((s) => s.error)
  const mensajes = useMensajesActivos()
  const userId = useAuthStore((s) => s.session?.userId ?? '')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const sala = salas.find((s) => s.id === salaActiva)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [mensajes.length, salaActiva])

  if (!sala) {
    return (
      <div
        className={`h-full flex-1 items-center justify-center text-sm text-text-muted md:flex ${className}`}
      >
        Selecciona una conversación
      </div>
    )
  }

  return (
    <div className={`h-full min-w-0 flex-1 flex-col md:flex ${className}`}>
      <header className="flex items-center gap-3 border-b border-border bg-bg-surface px-4 py-3">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Volver a conversaciones"
            className="rounded-md p-1 text-text-muted hover:text-text-primary md:hidden cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-blue/15 text-xs font-bold text-accent-blue">
          {initials(sala.name)}
        </div>
        <div>
          <h3 className="text-sm font-semibold">{sala.name}</h3>
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <Users size={12} /> {sala.membersCount} miembros
          </p>
        </div>
      </header>

      {error && (
        <p className="border-b border-accent-red/40 bg-accent-red/10 px-4 py-2 text-xs text-accent-red">
          {error}
        </p>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {mensajes.length === 0 ? (
          <p className="pt-6 text-center text-xs text-text-muted">
            Todavía no hay mensajes en esta sala.
          </p>
        ) : (
          mensajes.map((mensaje) => (
            <MessageBubble
              key={mensaje.id}
              mensaje={mensaje}
              propio={mensaje.senderId === userId}
              onImageClick={setLightboxUrl}
            />
          ))
        )}
      </div>

      <ChatInput />

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-100 flex cursor-zoom-out items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Imagen ampliada"
            className="max-h-[85vh] max-w-full rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}
