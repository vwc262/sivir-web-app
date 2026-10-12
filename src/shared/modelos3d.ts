// Modelos 3D que se dibujan en el mapa, cada uno en su propia ubicación.
//
// No dependen de condominios ni de casas: son puntos con su modelo. El archivo
// se resuelve contra CONFIG.modelos.baseUrl (VITE_MODELS_BASE_URL), así que
// aquí solo va el nombre; mover los .glb de servidor no toca esta lista.

export interface Modelo3D {
  /** Identificador estable de la instancia. */
  id: string
  /** Nombre legible del sitio, p. ej. "Torre Manacar". Sin él se muestra el id. */
  nombre?: string
  /** Nombre del .glb dentro de la URL base, p. ej. "caseta.glb". */
  archivo: string
  lat: number
  lng: number
  /**
   * Factor de escala uniforme. Mapbox interpreta el glb en metros: un modelo
   * exportado en otra unidad se corrige aquí. Por defecto 1.
   */
  escala?: number
  /** Giro sobre el eje vertical, en grados. 0 deja el modelo como viene. */
  rotacion?: number
  /** Ficha que se muestra al hacer clic en el modelo. Sin ella, una de ejemplo. */
  info?: InfoSitio
}

export type EstadoSitio = 'operativo' | 'mantenimiento' | 'cerrado'

/** Ficha de un sitio, la que abre el panel al hacer clic en su modelo. */
export interface InfoSitio {
  /** Qué es: "Edificio corporativo", "Centro comercial"… */
  tipo: string
  descripcion: string
  direccion: string
  estado: EstadoSitio
  niveles: number
  superficieM2: number
  horario: string
  responsable: { nombre: string; telefono: string }
}

// ── Ficha de ejemplo ─────────────────────────────────────────────────────────
//
// Mientras no haya datos reales, cada sitio sin `info` recibe una ficha
// inventada. Se elige a partir del id para que sea distinta entre sitios pero
// siempre la misma para cada uno: si cambiara en cada clic parecería un dato
// que se actualiza. El panel la marca como "Datos de ejemplo".

const TIPOS = ['Edificio corporativo', 'Centro comercial', 'Torre de oficinas', 'Hospital', 'Hotel']
const ESTADOS: EstadoSitio[] = ['operativo', 'operativo', 'operativo', 'mantenimiento', 'cerrado']
const CALLES = ['Av. Insurgentes Sur', 'Av. Revolución', 'Av. Patriotismo', 'Calle Félix Cuevas', 'Av. Universidad']
const RESPONSABLES = ['Laura Méndez', 'Ricardo Salas', 'Paola Ortega', 'Andrés Villalobos', 'Mónica Fuentes']

/** Hash estable y barato de un texto, para elegir valores de ejemplo. */
function semilla(texto: string): number {
  let h = 0
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

const elegir = <T,>(lista: T[], n: number, salto: number): T => lista[(n >>> salto) % lista.length]

function fichaDeEjemplo(modelo: Modelo3D): InfoSitio {
  const n = semilla(modelo.id)
  const tipo = elegir(TIPOS, n, 0)
  return {
    tipo,
    descripcion: `${tipo} de ejemplo. Esta ficha es provisional: se sustituirá por la información real del sitio.`,
    direccion: `${elegir(CALLES, n, 3)} ${100 + (n % 1900)}, CDMX`,
    estado: elegir(ESTADOS, n, 6),
    niveles: 3 + (n % 40),
    superficieM2: 1_500 + (n % 45) * 500,
    horario: n % 2 === 0 ? 'Lunes a viernes, 8:00 – 20:00' : 'Todos los días, 24 horas',
    responsable: {
      nombre: elegir(RESPONSABLES, n, 9),
      telefono: `+52 55 0000 ${String(1000 + (n % 9000))}`,
    },
  }
}

/** La ficha de un sitio, y si es la de ejemplo (sin `info` configurada). */
export function infoDeSitio(modelo: Modelo3D): { info: InfoSitio; deEjemplo: boolean } {
  return modelo.info
    ? { info: modelo.info, deEjemplo: false }
    : { info: fichaDeEjemplo(modelo), deEjemplo: true }
}

export const MODELOS_3D: Modelo3D[] = [
  // { id: 'caseta-norte', archivo: 'caseta.glb', lat: 19.378, lng: -99.1647, escala: 1, rotacion: 0 },
  // { id: 'prueba-pato', archivo: 'manacar.glb', lat: 19.393664, lng: -99.1745978, escala: 1, rotacion: 0 },
  { id: 'prueba-pato', archivo: 'manacar.glb', lat: 19.3686919, lng: -99.1811193, escala: 0.933, rotacion: 0 },
  
]