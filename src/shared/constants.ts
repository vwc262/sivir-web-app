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

// ─── Cámaras IP (HLS) ────────────────────────────────────────────────
export interface HlsConfig {
  serverIp: string
  port: number
  pathTemplate: string
}

export const HLS_CONFIG: HlsConfig = {
  serverIp: import.meta.env.VITE_HLS_SERVER_IP ?? '192.168.15.220',
  port: Number(import.meta.env.VITE_HLS_PORT ?? 8080),
  pathTemplate: import.meta.env.VITE_HLS_PATH_TEMPLATE ?? '/live/camara-{id_camara}/live.m3u8',
}

/** Sobrescribe la configuración HLS en runtime. */
export function configureHls(partial: Partial<HlsConfig>): void {
  Object.assign(HLS_CONFIG, partial)
}

export const getCameraStreamUrl = (cameraId: number): string =>
  `http://${HLS_CONFIG.serverIp}:${HLS_CONFIG.port}${HLS_CONFIG.pathTemplate.replace(
    '{id_camara}',
    String(cameraId),
  )}`
