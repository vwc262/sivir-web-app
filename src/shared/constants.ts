import { CONFIG } from './config'

// El token y el estilo de Mapbox son configuración de despliegue, no código:
// viven en el `.env` (ver `.env.example`).
export const MAPBOX_TOKEN = CONFIG.mapbox.token
export const MAPBOX_STYLE = CONFIG.mapbox.style

// Fallback OSM: CartoDB Dark Matter (tiles ráster)
export const OSM_TILE_URL =
  'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'

export const OSM_ATTRIBUTION =
  '© OpenStreetMap © CARTO'

// Centro por defecto: CDMX
export const DEFAULT_CENTER: [number, number] = [-99.13, 19.432]
export const DEFAULT_ZOOM = 12.5

export const APP_VERSION = 'SIVIR v1.0.0 — © 2026'

export const STORAGE_KEYS = {
  session: 'sivir_session',
  provider: 'sivir_map_provider',
  settings: 'sivir_settings',
} as const

/** Roles de la plataforma (claim `roles` del token). */
export const ROLES = {
  admin: 'admin',
  cliente: 'cliente',
} as const

// La URL HLS de cada cámara ya no se arma aquí: la calcula el core a partir de
// la dirección pública del video-edge y viaja en el campo `hlsUrl` del
// inventario. Dónde vive el nodo de vídeo es configuración del despliegue, y
// repetirla en cada cliente obliga a cambiarla en todos cuando se mueve.
