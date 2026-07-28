// DTOs del dominio, espejo de los structs de sivir-rest-core
// (internal/residencial/types.go). Los nombres de campo son los que serializa
// el core; si cambian allí, hay que cambiarlos aquí.

export interface Condominio {
  id: string
  nombre: string
  direccion: string
  createdAt: string
}

/** Casa dentro de un condominio (en la base de datos, `residencial.viviendas`). */
export interface Casa {
  id: string
  condominioId: string
  identificador: string
  createdAt: string
}

export interface Sensor {
  id: string
  casaId: string
  sensorType: string
  ubicacion: string
  enabled: boolean
  createdAt: string
}

export interface Camara {
  id: string
  casaId: string
  nombre: string
  /** Origen que consume sivir-video-edge para la ingesta; el navegador no reproduce RTSP. */
  rtspUrl: string
  /** Identificador del flujo dentro del video-edge. */
  streamId: string
  /**
   * Manifiesto HLS listo para reproducir. Lo calcula el core a partir de la
   * dirección pública del video-edge: el sitio no arma esa URL, igual que no
   * arma las URLs prefirmadas de los adjuntos. Vacío = sin edge configurado.
   */
  hlsUrl: string
  enabled: boolean
  createdAt: string
}

/** Espejo local de una identidad de Keycloak (`iam.users`). */
export interface Usuario {
  id: string
  username: string
  displayName: string
  createdAt: string
}

export interface Membresia {
  id: string
  userId: string
  condominioId: string
  /** Vacío = la membresía alcanza a todo el condominio. */
  casaId: string
  role: string
}
