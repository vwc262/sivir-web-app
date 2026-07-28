// Cliente HTTP contra sivir-rest-core.
//
// El core sigue la convención simple-rest: paginación con `_start`/`_end`,
// ordenación con `_sort`/`_order` y el total de la colección en la cabecera
// `X-Total-Count` (expuesta por CORS). El token va en `Authorization: Bearer`;
// en modo dev el core no lo valida, pero se envía igual para que el camino sea
// el mismo en los dos modos.

import { CONFIG } from '../config'
import { getAccessToken } from '../auth/token'

/** Tiempo máximo de una petición antes de abortarla. */
const REQUEST_TIMEOUT_MS = 15_000

/** Error de una llamada al core, con el código para poder distinguir 404 de 500. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }

  /** Fallo de red o timeout: no hubo respuesta del servidor. */
  get isOffline(): boolean {
    return this.status === 0
  }
}

/** Valores admitidos en la query string; `undefined` y `null` se omiten. */
export type QueryParams = Record<string, string | number | boolean | undefined | null>

export interface ListResult<T> {
  data: T[]
  /** Total de la colección, no de la página (cabecera X-Total-Count). */
  total: number
}

export interface ListOptions extends QueryParams {
  _start?: number
  _end?: number
  _sort?: string
  _order?: 'asc' | 'desc'
}

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(CONFIG.coreUrl + path)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function request(path: string, params?: QueryParams, init?: RequestInit): Promise<Response> {
  const url = buildUrl(path, params)
  const token = await getAccessToken()

  // AbortController evita que una petición a un core caído deje la UI colgada.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })
  } catch (cause) {
    const reason = cause instanceof Error && cause.name === 'AbortError'
      ? 'la petición tardó demasiado'
      : 'no se pudo contactar con el servicio'
    throw new HttpError(0, url, `${reason} (${path})`)
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    throw new HttpError(response.status, url, await errorMessage(response))
  }
  return response
}

/** Extrae el mensaje del cuerpo de error del core, que responde {"error": "..."}. */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; message?: string }
    const detail = body.error ?? body.message
    if (detail) return detail
  } catch {
    // Cuerpo vacío o no-JSON: nos quedamos con el status.
  }
  return `${response.status} ${response.statusText}`
}

/** GET de un recurso único. */
export async function apiGet<T>(path: string, params?: QueryParams): Promise<T> {
  const response = await request(path, params)
  return (await response.json()) as T
}

/** GET de una colección, devolviendo también su total. */
export async function apiList<T>(path: string, options?: ListOptions): Promise<ListResult<T>> {
  const response = await request(path, options)
  const data = (await response.json()) as T[]
  // Sin la cabecera (p. ej. si CORS no la expone) el total cae al tamaño de la
  // página: es lo que se puede afirmar con lo recibido.
  const total = Number(response.headers.get('X-Total-Count') ?? data.length)
  return { data, total: Number.isFinite(total) ? total : data.length }
}

/** POST/PATCH/DELETE con cuerpo JSON. */
export async function apiSend<T>(
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await request(path, undefined, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
