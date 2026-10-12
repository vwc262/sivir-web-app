// Tipos propios de la interfaz. Los del dominio viven en `api/types.ts`,
// espejo de lo que sirve el core.
export type MapProvider = 'mapbox' | 'osm'

/** Ajuste de luz de la escena 3D del mapa (modelos y edificios extruidos). */
export type Iluminacion = 'dia' | 'atardecer' | 'noche'
export type AlertType = 'discreta' | 'critica'

export interface OperatorData {
  name: string
  unitId: string
  device: string
}
