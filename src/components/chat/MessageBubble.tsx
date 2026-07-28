import { Check, CheckCheck } from 'lucide-react'
import type { ChatMessage } from '@/shared'

interface MessageBubbleProps {
  message: ChatMessage
  onImageClick: (url: string) => void
}

export function MessageBubble({ message, onImageClick }: MessageBubbleProps) {
  const isOwn = message.senderId === 'me'
  const time = new Date(message.timestamp).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
          isOwn
            ? 'rounded-br-md bg-[#1e3a5f]'
            : 'rounded-bl-md bg-[#1c1c1f]'
        }`}
      >
        {message.imageUrl && (
          <button
            onClick={() => onImageClick(message.imageUrl!)}
            className="mb-1.5 block cursor-zoom-in overflow-hidden rounded-lg"
          >
            <img
              src={message.imageUrl}
              alt="Imagen adjunta"
              loading="lazy"
              className="max-h-52 w-full object-cover transition-transform hover:scale-[1.02]"
            />
          </button>
        )}
        {message.text && <p className="break-words whitespace-pre-wrap">{message.text}</p>}
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-text-muted">
          {time}
          {isOwn &&
            (message.status === 'sent' ? (
              <Check size={13} />
            ) : (
              <CheckCheck
                size={13}
                className={message.status === 'read' ? 'text-accent-blue' : ''}
              />
            ))}
        </div>
      </div>
    </div>
  )
}
