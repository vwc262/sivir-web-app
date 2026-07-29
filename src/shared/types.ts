// Tipos propios de la interfaz. Los del dominio viven en `api/types.ts`,
// espejo de lo que sirve el core.
export type MapProvider = 'mapbox' | 'osm'
export type AlertType = 'discreta' | 'critica'

export interface OperatorData {
  name: string
  unitId: string
  device: string
}
