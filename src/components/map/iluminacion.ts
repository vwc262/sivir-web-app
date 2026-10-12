// Iluminación de la escena 3D del mapa: modelos .glb y edificios extruidos.
//
// Es la API de luces de Mapbox GL v3 (setLights): una luz ambiental que rellena
// y una direccional que hace de sol o de luna. No cambia el color del mapa
// base —calles, agua, la capa raster de OSM—, que lo define el estilo; solo
// cómo se ven los volúmenes. `lightPreset` haría lo mismo de una vez, pero solo
// existe en el estilo Mapbox Standard, y este sitio usa uno propio y OSM.

import type { LightsSpecification, Map as MapboxMap } from 'mapbox-gl'
import type { Iluminacion } from '@/shared'

// `direction` es [azimut, ángulo polar] en grados: de dónde viene la luz y qué
// tan inclinada llega (0 = desde el cenit, 90 = rasante al horizonte).
const AJUSTES: Record<Iluminacion, LightsSpecification[]> = {
  dia: [
    { id: 'ambiente', type: 'ambient', properties: { color: 'hsl(210, 20%, 98%)', intensity: 0.5 } },
    {
      id: 'sol',
      type: 'directional',
      properties: {
        direction: [200, 40],
        color: 'hsl(45, 30%, 98%)',
        intensity: 0.7,
        'cast-shadows': true,
        'shadow-intensity': 0.5,
      },
    },
  ],
  atardecer: [
    { id: 'ambiente', type: 'ambient', properties: { color: 'hsl(250, 35%, 72%)', intensity: 0.35 } },
    {
      id: 'sol',
      type: 'directional',
      // Sol bajo por el poniente: luz cálida y sombras largas.
      properties: {
        direction: [250, 78],
        color: 'hsl(28, 90%, 68%)',
        intensity: 0.8,
        'cast-shadows': true,
        'shadow-intensity': 0.6,
      },
    },
  ],
  noche: [
    { id: 'ambiente', type: 'ambient', properties: { color: 'hsl(225, 45%, 45%)', intensity: 0.3 } },
    {
      id: 'sol',
      type: 'directional',
      // Luz de luna: fría y tenue. Sin sombras, que de noche apenas se
      // distinguirían y cuestan rendimiento.
      properties: {
        direction: [160, 50],
        color: 'hsl(215, 40%, 75%)',
        intensity: 0.25,
        'cast-shadows': false,
      },
    },
  ],
}

/**
 * Aplica el ajuste de luz al estilo actual.
 *
 * Igual que los modelos, hay que reaplicarlo en cada `style.load`: setStyle
 * sustituye la iluminación por la del estilo nuevo (o la de por defecto).
 */
export function aplicarIluminacion(map: MapboxMap, iluminacion: Iluminacion): void {
  map.setLights(AJUSTES[iluminacion])
}
