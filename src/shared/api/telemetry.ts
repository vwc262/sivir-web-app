// Telemetría de sensores (sivir-rest-core sobre Cassandra).
//
// Solo lectura: quien escribe es el mqtt-bridge desde la ingesta MQTT.
//
// El modelo de Cassandra asoma en la API y conviene entenderlo: las tablas se
// particionan por condominio, y el histórico además por fecha. Por eso toda
// consulta lleva condominio, y pedir "un día" y pedir "las últimas 24 h" son
// dos caminos distintos —tabla `telemetry_history` y tabla `telemetry_live`—,
// no el mismo con otro filtro.

import { apiGet, apiList, type ListResult } from './http'

/** Lectura de un sensor tal como la expone el core. */
export interface Lectura {
  /** Sintético (condominio|sensor|instante): Cassandra no tiene clave de fila. */
  id: string
  condominioId: string
  /** Casa del sensor, resuelta por el core contra el inventario de PostgreSQL. */
  viviendaId: string
  sensorId: string
  sensorType: string
  value: number
  unit: string
  timestamp: string
}

/** Resumen de un sensor en un rango de fechas. */
export interface Informe {
  sensorId: string
  condominioId: string
  desde: string
  hasta: string
  totalLecturas: number
  media: number
  maximo: number
  minimo: number
  lecturas: Lectura[] | null
}

export interface LecturasParams {
  condominioId: string
  /** YYYY-MM-DD para consultar el histórico de ese día; vacío = últimas 24 h. */
  fecha?: string
  sensorId?: string
  sensorType?: string
  limite?: number
}

export function listLecturas({
  condominioId,
  fecha,
  sensorId,
  sensorType,
  limite = 500,
}: LecturasParams): Promise<ListResult<Lectura>> {
  return apiList<Lectura>('/telemetry', {
    condominioId,
    fecha,
    sensorId,
    sensorType,
    _start: 0,
    _end: limite,
  })
}

export interface InformeParams {
  condominioId: string
  sensorId: string
  /** YYYY-MM-DD; por defecto el core toma los últimos 7 días. */
  desde?: string
  hasta?: string
  /** Incluir el detalle de lecturas además de los agregados. */
  lecturas?: boolean
}

export function getInforme({
  condominioId,
  sensorId,
  desde,
  hasta,
  lecturas = true,
}: InformeParams): Promise<Informe> {
  return apiGet<Informe>('/telemetry/informe', {
    condominioId,
    sensorId,
    desde,
    hasta,
    lecturas: lecturas ? 'true' : undefined,
  })
}
