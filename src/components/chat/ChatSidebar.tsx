import { useEffect } from 'react'
import { conversationTimeLabel, initials, useChatStore } from '@/shared'

interface ChatSidebarProps {
  onSelect?: () => void
  className?: string
}

export function ChatSidebar({ onSelect, className = '' }: ChatSidebarProps) {
  const salas = useChatStore((s) => s.salas)
  const salaActiva = useChatStore((s) => s.salaActiva)
  const mensajes = useChatStore((s) => s.mensajes)
  const sinLeer = useChatStore((s) => s.sinLeer)
  const cargando = useChatStore((s) => s.cargando)
  const cargarSalas = useChatStore((s) => s.cargarSalas)
  const abrirSala = useChatStore((s) => s.abrirSala)

  useEffect(() => {
    void cargarSalas()
  }, [cargarSalas])

  return (
    <div
      className={`h-full w-full flex-col border-r border-border bg-bg-surface md:flex md:w-[240px] md:shrink-0 ${className}`}
    >
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold tracking-wider text-text-muted uppercase">
          Conversaciones
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cargando && salas.length === 0 && (
          <p className="px-4 py-3 text-xs text-text-muted">Cargando…</p>
        )}

        {!cargando && salas.length === 0 && (
          <p className="px-4 py-3 text-xs text-text-muted">
            No perteneces a ninguna sala. Se asignan desde el panel de administración.
          </p>
        )}

        {salas.map((sala) => {
          const ultimos = mensajes[sala.id] ?? []
          const ultimo = ultimos[ultimos.length - 1]
          const activa = sala.id === salaActiva
          const pendientes = sinLeer[sala.id] ?? 0

          return (
            <button
              key={sala.id}
              onClick={() => {
                void abrirSala(sala.id)
                onSelect?.()
              }}
              className={`flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors cursor-pointer ${
                activa ? 'bg-accent-blue/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-blue/15 text-xs font-bold text-accent-blue">
                {initials(sala.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{sala.name}</p>
                  {ultimo && (
                    <span className="shrink-0 text-[10px] text-text-muted">
                      {conversationTimeLabel(ultimo.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-text-muted">
                    {ultimo?.content || (ultimo?.mediaUrl ? '📎 Adjunto' : `${sala.membersCount} miembros`)}
                  </p>
                  {pendientes > 0 && (
                    <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-accent-blue px-1.5 text-[10px] font-bold text-white">
                      {pendientes}
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
