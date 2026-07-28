import { useEffect, useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useChatStore } from '@/shared'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface ChatWindowProps {
  onBack?: () => void
  className?: string
}

export function ChatWindow({ onBack, className = '' }: ChatWindowProps) {
  const conversations = useChatStore((s) => s.conversations)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const conversation = conversations.find((c) => c.id === activeConversationId)
  const messageCount = conversation?.messages.length ?? 0

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messageCount, activeConversationId])

  if (!conversation) {
    return (
      <div className={`h-full flex-1 items-center justify-center text-sm text-text-muted md:flex ${className}`}>
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
          {initials(conversation.contactName)}
        </div>
        <div>
          <h3 className="text-sm font-semibold">{conversation.contactName}</h3>
          <p className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> En línea
          </p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {conversation.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onImageClick={setLightboxUrl} />
        ))}
      </div>

      <ChatInput conversationId={conversation.id} />

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
