import { useCallback } from 'react'
import { useInventario } from '@/shared'
import type { LiveAlert } from '@/shared'

export interface AlertLabels {
  /** Ubicación del sensor, o su id si el inventario no está disponible. */
  sensor: string
  /** Identificador de la casa, o cadena vacía si no se pudo determinar. */
  casa: string
}

/**
 * Traduce los identificadores de una alerta a texto legible.
 *
 * La casa se toma de la propia alerta si viene y, si no, del inventario: las
 * alertas que nacen en MQTT no la traen, porque el payload de telemetría solo
 * lleva condominio y sensor.
 */
export function useAlertLabels(): (alert: LiveAlert) => AlertLabels {
  const { casaLabel, sensorLabel, casaDeSensor } = useInventario()

  return useCallback(
    (alert: LiveAlert) => {
      const casaId = alert.casaId || casaDeSensor(alert.sensorId)
      return {
        sensor: sensorLabel(alert.sensorId),
        casa: casaId ? casaLabel(casaId) : '',
      }
    },
    [casaLabel, sensorLabel, casaDeSensor],
  )
}
