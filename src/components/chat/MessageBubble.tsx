import { formatMessageTime, type Mensaje } from '@/shared'

interface MessageBubbleProps {
  mensaje: Mensaje
  /** El mensaje lo escribió el usuario de esta sesión. */
  propio: boolean
  onImageClick: (url: string) => void
}

/** Un adjunto se muestra como imagen solo si lo es; el resto, como enlace. */
function esImagen(mediaType?: string): boolean {
  return Boolean(mediaType?.startsWith('image/'))
}

export function MessageBubble({ mensaje, propio, onImageClick }: MessageBubbleProps) {
  return (
    <div className={`flex ${propio ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
          propio ? 'rounded-br-md bg-[#1e3a5f]' : 'rounded-bl-md bg-[#1c1c1f]'
        }`}
      >
        {/* En una sala con varios participantes hace falta saber quién habla. */}
        {!propio && (
          <p className="mb-0.5 text-[11px] font-medium text-accent-blue">
            {mensaje.senderUsername}
          </p>
        )}

        {mensaje.mediaUrl &&
          (esImagen(mensaje.mediaType) ? (
            <button
              onClick={() => onImageClick(mensaje.mediaUrl!)}
              className="mb-1.5 block cursor-zoom-in overflow-hidden rounded-lg"
            >
              <img
                src={mensaje.mediaUrl}
                alt="Imagen adjunta"
                loading="lazy"
                className="max-h-52 w-full object-cover transition-transform hover:scale-[1.02]"
              />
            </button>
          ) : (
            <a
              href={mensaje.mediaUrl}
              target="_blank"
              rel="noreferrer"
              className="mb-1.5 block truncate rounded-lg bg-black/30 px-2 py-1.5 text-xs text-accent-blue underline"
            >
              Descargar adjunto
            </a>
          ))}

        {mensaje.content && <p className="break-words whitespace-pre-wrap">{mensaje.content}</p>}

        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-text-muted">
          {formatMessageTime(mensaje.createdAt)}
        </div>
      </div>
    </div>
  )
}
