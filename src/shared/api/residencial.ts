// Servicios del dominio residencial contra sivir-rest-core.

import { apiGet, apiList, type ListResult } from './http'
import type { Camara, Casa, Condominio, Dispositivo, Membresia, Sensor, Usuario } from './types'

/** Página amplia: el inventario de un condominio es pequeño y cabe de una vez. */
const PAGE = { _start: 0, _end: 200 } as const

export function listCondominios(): Promise<ListResult<Condominio>> {
  return apiList<Condominio>('/condominios', { ...PAGE, _sort: 'nombre', _order: 'asc' })
}

export function listCasas(condominioId?: string): Promise<ListResult<Casa>> {
  return apiList<Casa>('/casas', {
    ...PAGE,
    condominioId,
    _sort: 'identificador',
    _order: 'asc',
  })
}

export function listSensores(casaId?: string): Promise<ListResult<Sensor>> {
  return apiList<Sensor>('/sensores', { ...PAGE, casaId })
}

export function listCamaras(casaId?: string): Promise<ListResult<Camara>> {
  return apiList<Camara>('/camaras', { ...PAGE, casaId })
}

export function listMembresias(condominioId?: string): Promise<ListResult<Membresia>> {
  return apiList<Membresia>('/membresias', { ...PAGE, condominioId })
}

/** Espejo local de las identidades; el core no filtra usuarios por condominio. */
export function listUsuarios(): Promise<ListResult<Usuario>> {
  return apiList<Usuario>('/usuarios', { ...PAGE, _sort: 'username', _order: 'asc' })
}

/** Dispositivos, de un usuario concreto o de todos. */
export function listDispositivos(userId?: string): Promise<ListResult<Dispositivo>> {
  return apiList<Dispositivo>('/dispositivos', { ...PAGE, userId, _sort: 'alias', _order: 'asc' })
}

export const getCondominio = (id: string) => apiGet<Condominio>(`/condominios/${id}`)
export const getCasa = (id: string) => apiGet<Casa>(`/casas/${id}`)
export const getSensor = (id: string) => apiGet<Sensor>(`/sensores/${id}`)
export const getUsuario = (id: string) => apiGet<Usuario>(`/usuarios/${id}`)
