// Conexión WebSocket con sivir-realtime-hub.
//
// El hub agrupa a los clientes por el claim `condominio_id` del token, así que
// cambiar de condominio implica un token nuevo y, por tanto, una conexión nueva:
// no hay mensaje de "suscríbete a otro canal".
//
// El navegador no puede fijar cabeceras en el handshake WebSocket; por eso el
// token viaja como query param `access_token`, que es lo que el hub acepta como
// alternativa a `Authorization: Bearer`.

import type { ConnectionStatus } from './types'

/** Backoff exponencial acotado, para no martillear un hub caído. */
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

export interface HubClientOptions {
  url: string
  token: string
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
    this.open()
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

  private open(): void {
    const url = new URL(this.options.url)
    url.searchParams.set('access_token', this.options.token)

    this.options.onStatus('connecting')
    const socket = new WebSocket(url.toString())
    this.socket = socket

    socket.onopen = () => {
      this.attempts = 0
      this.options.onStatus('online')
    }

    socket.onmessage = (event) => {
      try {
        this.options.onMessage(JSON.parse(event.data as string))
      } catch {
        // Un mensaje ilegible no debe tumbar la conexión: se descarta.
        console.warn('[hub] mensaje no interpretable', event.data)
      }
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

  private scheduleReconnect(): void {
    // Jitter: si el hub se reinicia, evita que todos los clientes vuelvan a la vez.
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** this.attempts, RECONNECT_MAX_MS)
    const jittered = delay * (0.5 + Math.random() * 0.5)
    this.attempts += 1

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (!this.closedByUs) this.open()
    }, jittered)
  }
}
