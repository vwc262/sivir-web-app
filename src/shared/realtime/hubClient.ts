// Conexión WebSocket con sivir-realtime-hub.
//
// El hub agrupa a los clientes por el claim `condominio_id` del token, así que
// cambiar de condominio implica un token nuevo y, por tanto, una conexión nueva:
// no hay mensaje de "suscríbete a otro canal".
//
// El navegador no puede fijar cabeceras en el handshake WebSocket; por eso el
// token viaja como query param `access_token`, que es lo que el hub acepta como
// alternativa a `Authorization: Bearer`.
//
// El hub revalida el token periódicamente (no solo en el handshake) y avisa
// por dos mensajes de sistema, que este cliente intercepta sin pasárselos al
// consumidor de onMessage —es un asunto de transporte, no un dato de dominio—:
// `auth.expiring` (el token está por vencer, la conexión sigue abierta) y
// `auth.expired` (el hub va a cerrar la conexión a continuación). En ambos
// casos reconectamos pidiendo un token fresco: oidc-client-ts ya lo renueva
// solo en segundo plano (`automaticSilentRenew`), así que para cuando llega
// cualquiera de los dos avisos ya hay uno nuevo disponible sin interacción
// del usuario.

import type { ConnectionStatus } from './types'

/** Backoff exponencial acotado, para no martillear un hub caído. */
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

interface AuthNotice {
  type: 'auth.expiring' | 'auth.expired'
  expiresAt?: number
}

function asAuthNotice(raw: unknown): AuthNotice | null {
  if (typeof raw !== 'object' || raw === null) return null
  const t = (raw as { type?: unknown }).type
  if (t === 'auth.expiring' || t === 'auth.expired') return raw as AuthNotice
  return null
}

export interface HubClientOptions {
  url: string
  /** Se llama en cada conexión y reconexión: nunca un token fijo, porque una
   * sesión larga necesita uno fresco más de una vez. */
  getToken: () => Promise<string | null>
  onMessage: (raw: unknown) => void
  onStatus: (status: ConnectionStatus) => void
}

export class HubClient {
  private socket: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private attempts = 0
  /** Cierre pedido por la aplicación: no se debe reconectar. */
  private closedByUs = false

  constructor(private readonly options: HubClientOptions) {}

  connect(): void {
    this.closedByUs = false
    void this.open()
  }

  /**
   * Envía un mensaje al hub. Devuelve false si la conexión no está abierta:
   * quien llama decide qué hacer, que no es lo mismo encolar un mensaje de chat
   * que descartarlo.
   */
  enviar(mensaje: unknown): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) return false
    this.socket.send(JSON.stringify(mensaje))
    return true
  }

  /** Cierra la conexión y cancela cualquier reintento pendiente. */
  close(): void {
    this.closedByUs = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.socket?.close()
    this.socket = null
    this.options.onStatus('idle')
  }

  private async open(): Promise<void> {
    this.options.onStatus('connecting')
    const token = await this.options.getToken()
    if (this.closedByUs) return
    if (!token) {
      this.options.onStatus('offline')
      return
    }

    const url = new URL(this.options.url)
    url.searchParams.set('access_token', token)

    const socket = new WebSocket(url.toString())
    this.socket = socket

    socket.onopen = () => {
      this.attempts = 0
      this.options.onStatus('online')
    }

    socket.onmessage = (event) => {
      let parsed: unknown
      try {
        parsed = JSON.parse(event.data as string)
      } catch {
        // Un mensaje ilegible no debe tumbar la conexión: se descarta.
        console.warn('[hub] mensaje no interpretable', event.data)
        return
      }

      const notice = asAuthNotice(parsed)
      if (notice) {
        // Asunto de transporte: no le llega al consumidor de onMessage.
        this.reconnectWithFreshToken(notice.type)
        return
      }

      this.options.onMessage(parsed)
    }

    socket.onerror = () => {
      // El evento de error no trae detalle; el cierre que viene detrás es quien
      // dispara la reconexión.
      this.options.onStatus('offline')
    }

    socket.onclose = () => {
      this.socket = null
      if (this.closedByUs) return
      this.options.onStatus('offline')
      this.scheduleReconnect()
    }
  }

  /**
   * Reconecta pidiendo un token fresco, sin pasar por el backoff de
   * scheduleReconnect: esto es un refresco planeado, no una falla.
   *
   * Con auth.expiring la conexión actual sigue viva; se cierra aquí mismo en
   * vez de esperar a que el hub la tumbe con auth.expired, para no dejar un
   * hueco sin conexión entre un aviso y el otro. Con auth.expired el hub ya
   * mandó el cierre justo detrás del mensaje: cerrar de nuestro lado es
   * redundante pero inofensivo.
   */
  private reconnectWithFreshToken(reason: AuthNotice['type']): void {
    if (this.closedByUs) return
    console.info(`[hub] ${reason}: reconectando con token fresco`)

    const stale = this.socket
    this.socket = null
    if (stale) {
      // Sin esto, el onclose del socket viejo dispararía su propio
      // scheduleReconnect y terminaríamos con dos conexiones en camino.
      stale.onclose = null
      stale.close()
    }

    void this.open()
  }

  private scheduleReconnect(): void {
    // Jitter: si el hub se reinicia, evita que todos los clientes vuelvan a la vez.
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** this.attempts, RECONNECT_MAX_MS)
    const jittered = delay * (0.5 + Math.random() * 0.5)
    this.attempts += 1

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (!this.closedByUs) void this.open()
    }, jittered)
  }
}

/**
 * Conexión activa del proceso.
 *
 * El hook `useHubConnection` la instala al conectarse y la retira al cerrarse.
 * Existe porque enviar un mensaje no es un efecto de React: lo dispara el
 * usuario desde cualquier pantalla, y pasar el cliente por props o por contexto
 * hasta el cuadro de texto solo añadiría ceremonia.
 */
let activo: HubClient | null = null

export function registrarHub(cliente: HubClient | null): void {
  activo = cliente
}

/** Envía por la conexión activa. False si no hay conexión abierta. */
export function enviarPorHub(mensaje: unknown): boolean {
  return activo?.enviar(mensaje) ?? false
}
