// Conversaciones del usuario.
//
// El historial se pide al core; los mensajes nuevos llegan por el WebSocket del
// hub, incluidos los propios: se envían por la misma vía y vuelven con su
// identificador ya asignado. Así el emisor ve exactamente lo que quedó
// guardado, no una copia optimista que podría diferir.

import { create } from 'zustand'
import { enviarAdjunto, listMensajes, listSalas, type Mensaje, type Sala } from '../api'
import { EVENT_CHAT_MESSAGE, EVENT_CHAT_RELAY, type ChatMessageEvent } from '../realtime/types'
import { enviarPorHub } from '../realtime/hubClient'
import { useAuthStore } from './useAuthStore'

interface ChatState {
  salas: Sala[]
  /** Mensajes por sala, del más antiguo al más nuevo. */
  mensajes: Record<string, Mensaje[]>
  salaActiva: string | null
  /** Mensajes sin leer por sala; se ponen a cero al abrirla. */
  sinLeer: Record<string, number>
  borrador: string
  cargando: boolean
  error: string | null

  cargarSalas: () => Promise<void>
  abrirSala: (roomId: string) => Promise<void>
  setBorrador: (texto: string) => void
  enviar: () => boolean
  adjuntar: (file: File) => Promise<void>
  recibir: (evento: ChatMessageEvent) => void
  limpiar: () => void
}

// Referencia estable: devolver un array nuevo en cada llamada haría
// re-renderizar sin que hubiera cambiado nada.
const VACIO: Mensaje[] = []

/** Convierte el mensaje que difunde el hub a la forma del historial. */
function deEvento(evento: ChatMessageEvent): Mensaje {
  return {
    id: evento.message_id,
    roomId: evento.room_id,
    senderId: evento.sender_id,
    senderUsername: evento.sender_name,
    content: evento.content,
    createdAt: evento.created_at,
  }
}

export const useChatStore = create<ChatState>()((set, get) => ({
  salas: [],
  mensajes: {},
  salaActiva: null,
  sinLeer: {},
  borrador: '',
  cargando: false,
  error: null,

  cargarSalas: async () => {
    const session = useAuthStore.getState().session
    if (!session) return

    set({ cargando: true })
    try {
      const salas = await listSalas(session.userId)
      set({ salas, error: null })
      // Abrir la primera evita que la pantalla arranque vacía.
      if (salas.length > 0 && !get().salaActiva) {
        await get().abrirSala(salas[0].id)
      }
    } catch {
      set({ salas: [], error: 'No se pudieron cargar las conversaciones' })
    } finally {
      set({ cargando: false })
    }
  },

  abrirSala: async (roomId) => {
    set((s) => ({
      salaActiva: roomId,
      borrador: '',
      sinLeer: { ...s.sinLeer, [roomId]: 0 },
    }))
    try {
      const mensajes = await listMensajes(roomId)
      set((s) => ({ mensajes: { ...s.mensajes, [roomId]: mensajes }, error: null }))
    } catch {
      set({ error: 'No se pudo cargar el historial' })
    }
  },

  setBorrador: (texto) => set({ borrador: texto }),

  enviar: () => {
    const { borrador, salaActiva } = get()
    const texto = borrador.trim()
    if (!texto || !salaActiva) return false

    // El mensaje no se pinta aquí: vuelve por la difusión, ya guardado y con su
    // identificador. Si la conexión está caída no se envía, y el borrador se
    // conserva para no perder lo escrito.
    const enviado = enviarPorHub({
      type: EVENT_CHAT_MESSAGE,
      room_id: salaActiva,
      content: texto,
      client_id: `web-${Date.now()}`,
    })
    if (enviado) set({ borrador: '' })
    return enviado
  },

  adjuntar: async (file) => {
    const { salaActiva } = get()
    const session = useAuthStore.getState().session
    if (!salaActiva || !session) return

    try {
      // Los binarios van por HTTP al core, que es quien habla con el
      // almacenamiento. El mensaje resultante se añade aquí porque esta vía no
      // pasa por la difusión del hub: al remitente hay que pintárselo a mano.
      const mensaje = await enviarAdjunto(salaActiva, session.userId, file)
      set((s) => ({
        mensajes: {
          ...s.mensajes,
          [salaActiva]: [...(s.mensajes[salaActiva] ?? []), mensaje],
        },
      }))

      // Al resto de la sala —conectados y ausentes— hay que avisarles por
      // otra vía: el hub no se enteró de este mensaje porque nunca pasó por
      // él. No se le manda el contenido, solo dónde encontrarlo: el hub
      // vuelve a preguntarle al core antes de difundir o notificar nada.
      enviarPorHub({
        type: EVENT_CHAT_RELAY,
        room_id: salaActiva,
        message_id: mensaje.id,
      })
    } catch {
      set({ error: 'No se pudo enviar el adjunto' })
    }
  },

  recibir: (evento) => {
    const mensaje = deEvento(evento)
    set((s) => {
      const actuales = s.mensajes[mensaje.roomId] ?? []
      // Una reconexión puede reentregar lo mismo: se descarta por id.
      if (actuales.some((m) => m.id === mensaje.id)) return s

      const esOtraSala = s.salaActiva !== mensaje.roomId
      const propio = mensaje.senderId === useAuthStore.getState().session?.userId

      return {
        mensajes: { ...s.mensajes, [mensaje.roomId]: [...actuales, mensaje] },
        sinLeer:
          esOtraSala && !propio
            ? { ...s.sinLeer, [mensaje.roomId]: (s.sinLeer[mensaje.roomId] ?? 0) + 1 }
            : s.sinLeer,
      }
    })
  },

  limpiar: () => set({ salas: [], mensajes: {}, salaActiva: null, sinLeer: {}, borrador: '' }),
}))

/** Mensajes de la sala abierta. */
export const useMensajesActivos = (): Mensaje[] =>
  useChatStore((s) => (s.salaActiva ? (s.mensajes[s.salaActiva] ?? VACIO) : VACIO))

/** Total de mensajes sin leer, para el indicador de la navegación. */
export const useMensajesSinLeer = (): number =>
  useChatStore((s) => Object.values(s.sinLeer).reduce((total, n) => total + n, 0))
