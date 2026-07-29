// Mensajes que entrega el realtime-hub por WebSocket.
//
// Espejo de `events.ClientMessage` de sivir-contracts (events/event.go): el hub
// reenvía tal cual lo que publica el event-dispatcher en Redis. Sigue el patrón
// Hydrate del documento de arquitectura: solo identificadores y un texto corto;
// el detalle se pide al core si hace falta.

/** Gravedad de una alerta, igual que `events.Severity`. */
export type Severity = 'critical' | 'warning'

/** Tipo de evento de alerta IoT (`events.EventTypeIoTAlert`). */
export const EVENT_IOT_ALERT = 'iot.alert'

export interface ClientMessage {
  type: string
  condominio_id: string
  vivienda_id?: string
  sensor_id: string
  sensor_type: string
  severity: Severity
  message: string
  occurred_at: string
}

/** Alerta ya normalizada para la UI, con lo que el sitio añade por su cuenta. */
export interface LiveAlert {
  /** Identificador local: el hub no envía uno, y hace falta para la lista. */
  id: string
  condominioId: string
  /** Casa afectada (el core la llama vivienda en la base de datos). */
  casaId: string
  sensorId: string
  sensorType: string
  severity: Severity
  message: string
  occurredAt: string
  receivedAt: string
  /** Se marca al abrir el panel; alimenta el contador de no leídas. */
  read: boolean
}

/** Estado de la conexión con el hub, para poder mostrarlo en la interfaz. */
export type ConnectionStatus = 'idle' | 'connecting' | 'online' | 'offline'

/** Tipos de mensaje del estado en vivo de dispositivos (`events/device.go`). */
export const EVENT_DEVICE_STATE = 'device.state'
export const EVENT_DEVICE_SNAPSHOT = 'device.snapshot'

/**
 * Estado de un dispositivo, tal como lo difunde el hub.
 *
 * `online: false` no significa que el dato sobre. Conserva la última posición
 * conocida, que es justo lo que interesa cuando un dispositivo deja de reportar.
 */
export interface DeviceState {
  type: string
  condominio_id: string
  dispositivo_id: string
  user_id: string
  lat: number
  lng: number
  battery: number
  online: boolean
  occurred_at: string
  updated_at: string
}

/** Estado de todos los dispositivos del condominio, al conectarse un cliente. */
export interface DeviceSnapshot {
  type: string
  condominio_id: string
  devices: DeviceState[]
}

/** Reconoce un mensaje de estado de dispositivo. */
export function asDeviceState(raw: unknown): DeviceState | null {
  if (typeof raw !== 'object' || raw === null) return null
  const msg = raw as Partial<DeviceState>
  if (msg.type !== EVENT_DEVICE_STATE || !msg.dispositivo_id) return null
  return msg as DeviceState
}

/** Tipo de mensaje de chat (`events/chat.go`). */
export const EVENT_CHAT_MESSAGE = 'chat.message'

/**
 * Mensaje de chat tal como lo difunde el hub.
 *
 * `message_id` es una cadena porque es un Snowflake de 64 bits: como número
 * perdería precisión en JavaScript y dos mensajes distintos podrían acabar con
 * el mismo identificador.
 */
export interface ChatMessageEvent {
  type: string
  room_id: string
  message_id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
  /** Identificador que puso el emisor, para reconocer su propio mensaje. */
  client_id?: string
}

/** Reconoce un mensaje de chat. */
export function asChatMessage(raw: unknown): ChatMessageEvent | null {
  if (typeof raw !== 'object' || raw === null) return null
  const msg = raw as Partial<ChatMessageEvent>
  if (msg.type !== EVENT_CHAT_MESSAGE || !msg.room_id) return null
  return msg as ChatMessageEvent
}

/** Reconoce la instantánea inicial del condominio. */
export function asDeviceSnapshot(raw: unknown): DeviceSnapshot | null {
  if (typeof raw !== 'object' || raw === null) return null
  const msg = raw as Partial<DeviceSnapshot>
  if (msg.type !== EVENT_DEVICE_SNAPSHOT || !Array.isArray(msg.devices)) return null
  return msg as DeviceSnapshot
}

/** Convierte el mensaje del hub en una alerta de la UI. Devuelve null si no lo es. */
export function toLiveAlert(raw: unknown): LiveAlert | null {
  if (typeof raw !== 'object' || raw === null) return null
  const msg = raw as Partial<ClientMessage>

  if (msg.type !== EVENT_IOT_ALERT) return null
  if (!msg.condominio_id || !msg.sensor_id) return null

  const receivedAt = new Date().toISOString()
  return {
    // sensor + instante identifican la alerta sin ambigüedad dentro de la sesión.
    id: `${msg.sensor_id}|${msg.occurred_at ?? receivedAt}`,
    condominioId: msg.condominio_id,
    casaId: msg.vivienda_id ?? '',
    sensorId: msg.sensor_id,
    sensorType: msg.sensor_type ?? '',
    severity: msg.severity === 'warning' ? 'warning' : 'critical',
    message: msg.message ?? 'Alerta sin descripción',
    occurredAt: msg.occurred_at ?? receivedAt,
    receivedAt,
    read: false,
  }
}
