// Inventario del condominio activo: casas y sensores, indexados por id.
//
// Las alertas del hub llegan con identificadores, no con nombres (patrón
// Hydrate): el sitio los traduce con el inventario del core para poder decir
// "Puerta principal · Casa A-101" en lugar de "sens-door-001 · viv-101".

import { useEffect, useMemo, useState } from 'react'
import { listCasas, listSensores, type Casa, type Sensor } from '../api'
import { useAuthStore } from '../store/useAuthStore'

interface InventarioData {
  casas: Casa[]
  sensores: Sensor[]
}

interface Inventario extends InventarioData {
  /** Identificador legible de la casa ("A-101"), o el id si no se conoce. */
  casaLabel: (casaId: string) => string
  /** Ubicación del sensor ("Puerta principal"), o el id si no se conoce. */
  sensorLabel: (sensorId: string) => string
  /**
   * Casa a la que pertenece un sensor.
   *
   * Las alertas que nacen en MQTT no traen la vivienda: el payload de telemetría
   * solo lleva condominio y sensor, y el mqtt-bridge no consulta el inventario.
   * La relación sensor→casa la tiene el core, así que se resuelve aquí.
   */
  casaDeSensor: (sensorId: string) => string
}

const VACIO: InventarioData = { casas: [], sensores: [] }

/**
 * Caché por condominio de la promesa en curso. Varios componentes usan este
 * hook a la vez (el aviso emergente y el panel de alertas); sin la caché cada
 * uno lanzaría su propia pareja de peticiones.
 */
const cache = new Map<string, Promise<InventarioData>>()

function cargar(condominioId: string): Promise<InventarioData> {
  const enCurso = cache.get(condominioId)
  if (enCurso) return enCurso

  // El core filtra sensores por casa, no por condominio: se traen todos y se
  // recortan con las casas del condominio. Con inventarios grandes esto debería
  // pasar a un filtro del core.
  const promise = Promise.all([listCasas(condominioId), listSensores()])
    .then(([casasRes, sensoresRes]) => {
      const propias = new Set(casasRes.data.map((c) => c.id))
      return {
        casas: casasRes.data,
        sensores: sensoresRes.data.filter((s) => propias.has(s.casaId)),
      }
    })
    .catch(() => {
      // El inventario es decoración: si falla, las alertas se muestran con sus
      // identificadores en crudo en lugar de perderse. No se cachea el fallo.
      cache.delete(condominioId)
      return VACIO
    })

  cache.set(condominioId, promise)
  return promise
}

export function useInventario(): Inventario {
  const condominioId = useAuthStore((s) => s.session?.condominioId ?? '')
  const [data, setData] = useState<InventarioData>(VACIO)

  useEffect(() => {
    if (!condominioId) {
      setData(VACIO)
      return
    }
    let cancelled = false
    void cargar(condominioId).then((inventario) => {
      if (!cancelled) setData(inventario)
    })
    return () => {
      cancelled = true
    }
  }, [condominioId])

  return useMemo(() => {
    const casaPorId = new Map(data.casas.map((c) => [c.id, c.identificador]))
    const sensorPorId = new Map(data.sensores.map((s) => [s.id, s.ubicacion || s.sensorType]))
    const casaPorSensor = new Map(data.sensores.map((s) => [s.id, s.casaId]))
    return {
      ...data,
      casaLabel: (id) => casaPorId.get(id) ?? id,
      sensorLabel: (id) => sensorPorId.get(id) ?? id,
      casaDeSensor: (id) => casaPorSensor.get(id) ?? '',
    }
  }, [data])
}
