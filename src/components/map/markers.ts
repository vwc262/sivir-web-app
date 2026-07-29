// Marcadores del mapa, uno por tipo de entidad.
//
// La jerarquía del sistema es condominio → casa → dispositivo, y en el mapa
// conviven las tres: un punto genérico para todas obligaría a leer el tooltip
// para saber qué se está mirando. Cada tipo tiene su forma:
//
//   condominio  edificio, discreto: es el contenedor, no el objeto de interés.
//   casa        vivienda, con su identificador al lado.
//   dispositivo círculo, que es la convención habitual para "alguien está aquí".
//
// Los marcadores se crean como elementos del DOM porque así los recibe
// mapboxgl.Marker; el SVG va en línea para no depender de una petición extra
// por icono.

/** Iconos, en trazo para que hereden el color del contenedor. */
const ICONOS = {
  condominio: `<path d="M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16"/><path d="M14 9h4a1 1 0 0 1 1 1v11"/><path d="M3 21h18"/><path d="M8 8h2M8 12h2M8 16h2"/>`,
  casa: `<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M10 20v-5h4v5"/>`,
  dispositivo: `<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>`,
} as const

type TipoMarcador = keyof typeof ICONOS

function svg(tipo: TipoMarcador): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[tipo]}</svg>`
}

/** Escapa el texto que se inyecta como HTML: los nombres vienen de la base. */
function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

export interface MarcadorCasaOptions {
  identificador: string
  /** Hay una alerta viva en esta casa: se destaca y pulsa. */
  enAlerta: boolean
  onClick: () => void
}

/** Marcador de una casa: pin con forma de vivienda y su identificador. */
export function crearMarcadorCasa({
  identificador,
  enAlerta,
  onClick,
}: MarcadorCasaOptions): HTMLElement {
  const el = document.createElement('div')
  el.className = `map-pin map-pin--casa${enAlerta ? ' map-pin--alerta' : ''}`
  el.setAttribute('aria-label', `Casa ${identificador}`)
  el.title = `Casa ${identificador}`
  el.innerHTML = `${svg('casa')}<span class="map-pin__label">${escapar(identificador)}</span>`
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    onClick()
  })
  return el
}

/**
 * Marcador del centro del condominio. Sin etiqueta ni clic: es una referencia
 * del encuadre, no algo que se seleccione.
 */
export function crearMarcadorCondominio(nombre: string): HTMLElement {
  const el = document.createElement('div')
  el.className = 'map-pin map-pin--condominio'
  el.setAttribute('aria-label', `Condominio ${nombre}`)
  el.title = nombre
  el.innerHTML = svg('condominio')
  return el
}

export interface MarcadorDispositivoOptions {
  alias: string
  /** Nivel de batería 0–100, si se conoce. */
  bateria?: number
  onClick?: () => void
}

/**
 * Marcador de un dispositivo activo. La posición en vivo llega en el slice 6;
 * la forma se define aquí para que el vocabulario visual del mapa esté completo
 * y las casas ya se distingan de las personas.
 */
export function crearMarcadorDispositivo({
  alias,
  bateria,
  onClick,
}: MarcadorDispositivoOptions): HTMLElement {
  const el = document.createElement('div')
  el.className = 'map-pin map-pin--dispositivo'
  el.setAttribute('aria-label', alias)
  el.title = bateria === undefined ? alias : `${alias} · ${bateria}%`
  el.innerHTML = svg('dispositivo')
  if (onClick) {
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      onClick()
    })
  }
  return el
}
