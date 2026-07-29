// Chat: salas, historial y adjuntos (sivir-rest-core).
//
// El envío de un mensaje NO pasa por aquí: viaja por el WebSocket del hub, que
// lo guarda, lo difunde a los miembros conectados y publica el evento de las
// notificaciones. Por HTTP se hacen las dos cosas que el WebSocket no debe
// hacer: leer el historial y subir binarios.

import { CONFIG } from '../config'
import { getAccessToken } from '../auth/token'
import { apiGet, apiList, HttpError } from './http'

export interface Sala {
  id: string
  name: string
  condominioId: string
  membersCount: number
  createdAt: string
}

export interface Mensaje {
  /** Snowflake. Cadena a propósito: como número perdería precisión en JS. */
  id: string
  roomId: string
  senderId: string
  senderUsername: string
  content: string
  /** URL prefirmada del adjunto, de vigencia acotada. */
  mediaUrl?: string
  mediaType?: string
  createdAt: string
}

/** Salas a las que pertenece un usuario. */
export function listSalas(userId: string): Promise<Sala[]> {
  return apiGet<Sala[]>(`/usuarios/${userId}/chats`)
}

/** Historial reciente de una sala, del más antiguo al más nuevo. */
export async function listMensajes(roomId: string, limit = 50): Promise<Mensaje[]> {
  const { data } = await apiList<Mensaje>(`/chats/${roomId}/messages`, { limit })
  // El core los devuelve del más reciente al más antiguo (orden de Snowflake);
  // en pantalla se leen al revés.
  return [...data].reverse()
}

/**
 * Sube un adjunto y crea el mensaje que lo acompaña.
 *
 * Va por HTTP y no por el WebSocket a propósito: retransmitir binarios por la
 * conexión de tiempo real obligaría a bufferearlos en memoria y los pondría a
 * competir con los mensajes de control.
 */
export async function enviarAdjunto(
  roomId: string,
  senderId: string,
  file: File,
  content = '',
): Promise<Mensaje> {
  const form = new FormData()
  form.append('senderId', senderId)
  form.append('content', content)
  form.append('media', file)

  const token = await getAccessToken()
  const url = `${CONFIG.coreUrl}/chats/${roomId}/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })

  if (!response.ok) {
    throw new HttpError(response.status, url, `no se pudo enviar el adjunto (${response.status})`)
  }
  return (await response.json()) as Mensaje
}
