import { useRef, useState } from 'react'
import { Paperclip, SendHorizonal } from 'lucide-react'
import { useAlertsStore, useChatStore } from '@/shared'

export function ChatInput() {
  const borrador = useChatStore((s) => s.borrador)
  const setBorrador = useChatStore((s) => s.setBorrador)
  const enviar = useChatStore((s) => s.enviar)
  const adjuntar = useChatStore((s) => s.adjuntar)
  // El mensaje viaja por el WebSocket: sin conexión no hay a dónde mandarlo.
  const conectado = useAlertsStore((s) => s.status === 'online')
  const [aviso, setAviso] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canSend = borrador.trim().length > 0

  const handleSend = () => {
    if (!canSend) return
    if (!enviar()) {
      // El borrador se conserva: lo escrito no se pierde por una caída.
      setAviso('Sin conexión con el servidor de mensajería. Reintenta en unos segundos.')
      return
    }
    setAviso(null)
    const el = textareaRef.current
    if (el) el.style.height = 'auto'
  }

  const handleAttach = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    void adjuntar(file)
  }

  const autoResize = () => {
    const el = textareaRef.current
    if (!el || CSS.supports('field-sizing', 'content')) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  return (
    <div className="border-t border-border bg-bg-surface">
      {aviso && <p className="px-3 pt-2 text-[11px] text-accent-amber">{aviso}</p>}
      {!conectado && !aviso && (
        <p className="px-3 pt-2 text-[11px] text-text-muted">
          Reconectando con el servidor de mensajería…
        </p>
      )}
      <div className="flex items-end gap-2 p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          handleAttach(e.target.files)
          e.target.value = ''
        }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        aria-label="Adjuntar archivo"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary cursor-pointer"
      >
        <Paperclip size={18} />
      </button>
      <textarea
        ref={textareaRef}
        value={borrador}
        onChange={(e) => {
          setBorrador(e.target.value)
          autoResize()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
          }
        }}
        rows={1}
        placeholder="Escribe un mensaje…"
        className="chat-textarea min-h-10 flex-1 resize-none rounded-xl border border-border bg-bg-overlay px-3.5 py-2.5 text-sm outline-none placeholder:text-text-muted focus:border-accent-blue/50"
      />
      <button
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Enviar"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue text-white transition-all hover:bg-blue-600 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
      >
        <SendHorizonal size={18} />
      </button>
      </div>
    </div>
  )
}
