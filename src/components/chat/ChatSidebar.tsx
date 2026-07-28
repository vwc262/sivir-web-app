import { useChatStore } from '@/shared'

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function timeLabel(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

interface ChatSidebarProps {
  onSelect?: () => void
  className?: string
}

export function ChatSidebar({ onSelect, className = '' }: ChatSidebarProps) {
  const conversations = useChatStore((s) => s.conversations)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)

  return (
    <div
      className={`h-full w-full flex-col border-r border-border bg-bg-surface md:flex md:w-[240px] md:shrink-0 ${className}`}
    >
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Conversaciones
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => {
          const last = conv.messages[conv.messages.length - 1]
          const isActive = conv.id === activeConversationId
          return (
            <button
              key={conv.id}
              onClick={() => {
                setActiveConversation(conv.id)
                onSelect?.()
              }}
              className={`flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors cursor-pointer ${
                isActive ? 'bg-accent-blue/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-blue/15 text-xs font-bold text-accent-blue">
                {initials(conv.contactName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{conv.contactName}</p>
                  {last && (
                    <span className="shrink-0 text-[10px] text-text-muted">
                      {timeLabel(last.timestamp)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-text-muted">
                    {last?.text ?? (last?.imageUrl ? '📷 Imagen' : '')}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-accent-blue px-1.5 text-[10px] font-bold text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
