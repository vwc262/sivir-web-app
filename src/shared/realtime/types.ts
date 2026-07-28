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
