// Capa de modelos 3D (.glb) del mapa, con la capa `model` nativa de Mapbox GL
// v3: sin three.js ni capas personalizadas.
//
// Todas las instancias van en una sola fuente GeoJSON; cada punto dice qué
// modelo dibujar y con qué escala y giro. Un mismo .glb se registra una sola
// vez aunque aparezca en varios puntos.

import type { GeoJSONSource, Map as MapboxMap } from 'mapbox-gl'
import { CONFIG, MODELOS_3D, type Modelo3D } from '@/shared'

const FUENTE = 'modelos-3d'
/** Capa de los modelos propios; la zona de clic (areaClic.ts) la consulta. */
export const CAPA_MODELOS = 'modelos-3d'
const CAPA = CAPA_MODELOS

/** Tinte del modelo seleccionado en la herramienta de posicionamiento. */
const COLOR_RESALTADO = '#3b82f6'

/** Id del modelo en el estilo: uno por archivo. */
export const idModelo = (archivo: string): string => `modelo:${archivo}`

/** Cómo se dibujan las instancias, además de sus valores propios. */
export interface OpcionesCapa {
  /** Instancia teñida (la que se ajusta o la que tiene abierta su ficha). */
  resaltado?: string | null
  /** Instancias que no se dibujan: tampoco responden al clic. */
  ocultos?: Record<string, true>
}

function comoGeoJSON(modelos: Modelo3D[], { resaltado = null, ocultos = {} }: OpcionesCapa) {
  return {
    type: 'FeatureCollection' as const,
    features: modelos.filter((m) => !ocultos[m.id]).map((m, i) => {
      const escala = m.escala ?? 1
      return {
        type: 'Feature' as const,
        // Sin id de feature la capa de modelos no se puede consultar: Mapbox
        // indexa cada instancia por él y queryRenderedFeatures la busca por él.
        // Empieza en 1 y no en 0 (como haría generateId) porque Mapbox solo
        // indexa `if (feature.id)`: el modelo con id 0 nunca respondía al clic.
        id: i + 1,
        geometry: { type: 'Point' as const, coordinates: [m.lng, m.lat] },
        properties: {
          // El id de la instancia va en las propiedades: el del feature tiene
          // que ser numérico.
          instancia: m.id,
          modelo: idModelo(m.archivo),
          escala: [escala, escala, escala],
          rotacion: [0, 0, m.rotacion ?? 0],
          resaltado: m.id === resaltado,
        },
      }
    }),
  }
}

/**
 * Añade los modelos al estilo actual del mapa.
 *
 * Hay que llamarla en cada `style.load`, no solo al crear el mapa: setStyle
 * (el cambio entre Mapbox y OSM) borra las fuentes, capas y modelos que no
 * vienen en el estilo. Es idempotente para poder hacerlo sin más.
 */
export function instalarModelos3D(
  map: MapboxMap,
  modelos: Modelo3D[] = MODELOS_3D,
  opciones: OpcionesCapa = {},
): void {
  const base = CONFIG.modelos.baseUrl
  if (!base || modelos.length === 0) return

  // Se registran todos, también los ocultos: así mostrarlos de nuevo es solo
  // cambiar los puntos de la fuente.
  for (const archivo of new Set(modelos.map((m) => m.archivo))) {
    const id = idModelo(archivo)
    if (!map.hasModel(id)) map.addModel(id, `${base}/${archivo}`)
  }

  if (map.getSource(FUENTE)) return

  map.addSource(FUENTE, { type: 'geojson', data: comoGeoJSON(modelos, opciones) })
  map.addLayer({
    id: CAPA,
    type: 'model',
    source: FUENTE,
    layout: { 'model-id': ['get', 'modelo'] },
    paint: {
      'model-type': 'common-3d',
      'model-scale': ['array', 'number', 3, ['get', 'escala']],
      'model-rotation': ['array', 'number', 3, ['get', 'rotacion']],
      // Solo se ven si la luz direccional las proyecta (ver iluminacion.ts):
      // de noche está apagado y no cuestan nada.
      'model-cast-shadows': true,
      'model-receive-shadows': true,
      // Tinte del seleccionado: mezcla parcial, para que se siga viendo el
      // modelo y no una silueta azul.
      'model-color': COLOR_RESALTADO,
      'model-color-mix-intensity': ['case', ['get', 'resaltado'], 0.35, 0],
    },
  })
}

/**
 * Mueve las instancias ya instaladas a los valores dados, sin volver a
 * descargar los .glb: solo se reemplazan los puntos de la fuente. Si la capa
 * aún no existe no hace nada; la próxima instalación usará esos valores.
 */
export function actualizarModelos3D(map: MapboxMap, modelos: Modelo3D[], opciones: OpcionesCapa = {}): void {
  map.getSource<GeoJSONSource>(FUENTE)?.setData(comoGeoJSON(modelos, opciones))
}
