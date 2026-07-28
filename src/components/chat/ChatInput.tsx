import { useRef } from 'react'
import { Paperclip, SendHorizonal } from 'lucide-react'
import { useChatStore } from '@/shared'

interface ChatInputProps {
  conversationId: string
}

export function ChatInput({ conversationId }: ChatInputProps) {
  const draft = useChatStore((s) => s.draft)
  const setDraft = useChatStore((s) => s.setDraft)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canSend = draft.trim().length > 0

  const handleSend = () => {
    if (!canSend) return
    sendMessage(conversationId, { senderId: 'me', text: draft.trim() })
  }

  const handleAttach = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    sendMessage(conversationId, {
      senderId: 'me',
      imageUrl: URL.createObjectURL(file),
    })
  }

  const autoResize = () => {
    const el = textareaRef.current
    if (!el || CSS.supports('field-sizing', 'content')) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  return (
    <div className="flex items-end gap-2 border-t border-border bg-bg-surface p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleAttach(e.target.files)
          e.target.value = ''
        }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        aria-label="Adjuntar imagen"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary cursor-pointer"
      >
        <Paperclip size={18} />
      </button>
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
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
  )
}
