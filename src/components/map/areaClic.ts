// Zona de clic de los modelos 3D propios.
//
// Un modelo se da por pulsado cuando el clic cae dentro de la envolvente
// convexa de las 8 esquinas de su caja, proyectadas en pantalla. Es el mismo
// criterio que usa Mapbox internamente (queryGeometryIntersectsProjectedAabb),
// pero calculado aquí: la consulta de Mapbox (queryRenderedFeatures) filtra
// antes los candidatos por tesela pensando en puntos, y con modelos de una
// fuente GeoJSON solo acierta en una franja estrecha sobre la vertical del
// punto de anclaje, no en todo el edificio.
//
// El dibujo de depuración (AreaClicModelos) usa este mismo polígono, así que lo
// que se ve es exactamente lo que responde.

import type { Map as MapboxMap, PointLike } from 'mapbox-gl'
import type { Modelo3D } from '@/shared'
import { CAPA_MODELOS, idModelo } from './modelos3d'

/** Metros que mide un grado de latitud. */
const METROS_POR_GRADO = 111_320

export type Punto = { x: number; y: number }

/** Caja que envuelve un modelo, en sus coordenadas propias (metros, eje Y arriba). */
interface CajaModelo {
  min: [number, number, number]
  max: [number, number, number]
}

/**
 * Caja envolvente de un .glb ya descargado, o null si aún no ha cargado.
 *
 * Mapbox no la expone en su API pública: se lee de su gestor de modelos
 * interno. Si una versión futura cambia esa estructura, devuelve null y el clic
 * cae a la consulta de Mapbox (ver modeloEnPunto).
 */
function cajaDeModelo(map: MapboxMap, archivo: string): CajaModelo | null {
  type Registro = { model?: { aabb?: { min: ArrayLike<number>; max: ArrayLike<number> } } }
  const gestor = (map as unknown as { style?: { modelManager?: { models?: Record<string, unknown> } } }).style
    ?.modelManager
  const id = idModelo(archivo)
  // Los modelos se agrupan por "scope" del estilo; los añadidos con addModel
  // van en el scope vacío.
  const porScope = gestor?.models?.[''] as Record<string, Registro> | undefined
  const aabb = (porScope?.[id] ?? (gestor?.models?.[id] as Registro | undefined))?.model?.aabb
  if (!aabb) return null
  return {
    min: [aabb.min[0], aabb.min[1], aabb.min[2]],
    max: [aabb.max[0], aabb.max[1], aabb.max[2]],
  }
}

/**
 * Las 8 esquinas de la caja del modelo, en pantalla.
 *
 * Reproduce la colocación de Mapbox (calculateModelMatrix): el glTF tiene el
 * eje Y hacia arriba y Mapbox lo intercambia con Z (COORD_SPACE_TRANSFORM), de
 * modo que X queda al este, Z del glTF hacia el sur y Y como altura. Después
 * aplica la escala y el giro sobre el eje vertical.
 */
function esquinasEnPantalla(map: MapboxMap, modelo: Modelo3D): Punto[] | null {
  const caja = cajaDeModelo(map, modelo.archivo)
  if (!caja) return null

  const escala = modelo.escala ?? 1
  const giro = ((modelo.rotacion ?? 0) * Math.PI) / 180
  const cos = Math.cos(giro)
  const sin = Math.sin(giro)
  const metrosPorGradoLng = METROS_POR_GRADO * Math.cos((modelo.lat * Math.PI) / 180)

  const puntos: Punto[] = []
  for (const x of [caja.min[0], caja.max[0]]) {
    for (const y of [caja.min[1], caja.max[1]]) {
      for (const z of [caja.min[2], caja.max[2]]) {
        // Ejes del mapa: este, sur (la y de pantalla crece hacia abajo) y altura.
        const este = escala * (x * cos - z * sin)
        const sur = escala * (x * sin + z * cos)
        const p = map.project(
          [modelo.lng + este / metrosPorGradoLng, modelo.lat - sur / METROS_POR_GRADO],
          escala * y,
        )
        // Una esquina detrás de la cámara no tiene proyección útil.
        if (Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(p.x) < 1e6) puntos.push(p)
      }
    }
  }
  return puntos.length >= 3 ? puntos : null
}

/** Envolvente convexa (cadena monótona de Andrew), en orden. */
function envolvente(puntos: Punto[]): Punto[] {
  const p = [...puntos].sort((a, b) => a.x - b.x || a.y - b.y)
  const cruz = (o: Punto, a: Punto, b: Punto) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const cadena = (lista: Punto[]) => {
    const out: Punto[] = []
    for (const q of lista) {
      while (out.length >= 2 && cruz(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop()
      out.push(q)
    }
    return out
  }
  const inferior = cadena(p)
  const superior = cadena([...p].reverse())
  return [...inferior.slice(0, -1), ...superior.slice(0, -1)]
}

/** Polígono de pantalla que responde al clic de un modelo, o null si su .glb aún no cargó. */
export function poligonoClic(map: MapboxMap, modelo: Modelo3D): Punto[] | null {
  const esquinas = esquinasEnPantalla(map, modelo)
  return esquinas && envolvente(esquinas)
}

/** Punto dentro de un polígono convexo (en el orden que da `envolvente`). */
function dentro(punto: Punto, poligono: Punto[]): boolean {
  let signo = 0
  for (let i = 0; i < poligono.length; i++) {
    const a = poligono[i]
    const b = poligono[(i + 1) % poligono.length]
    const c = (b.x - a.x) * (punto.y - a.y) - (b.y - a.y) * (punto.x - a.x)
    if (c === 0) continue
    if (signo === 0) signo = Math.sign(c)
    else if (Math.sign(c) !== signo) return false
  }
  return true
}

/**
 * Qué modelo propio hay bajo un punto de la pantalla, o null.
 *
 * Solo considera los modelos dados (los visibles): los edificios 3D del mapa
 * base no cuentan. Si varios contienen el clic, gana el de anclaje más bajo en
 * pantalla, que con el mapa inclinado es el más cercano a la cámara.
 *
 * Para un modelo cuyo .glb aún no ha cargado (o si la caja no se pudiera leer)
 * se recurre a la consulta de Mapbox, que acierta al menos sobre la vertical
 * del anclaje.
 */
export function modeloEnPunto(map: MapboxMap, punto: PointLike, modelos: Modelo3D[]): string | null {
  if (!map.getLayer(CAPA_MODELOS)) return null
  const clic: Punto = Array.isArray(punto) ? { x: punto[0], y: punto[1] } : punto

  let elegido: { id: string; profundidad: number } | null = null
  let sinCaja = false
  for (const m of modelos) {
    const poligono = poligonoClic(map, m)
    if (!poligono) {
      sinCaja = true
      continue
    }
    if (!dentro(clic, poligono)) continue
    const profundidad = map.project([m.lng, m.lat]).y
    if (!elegido || profundidad > elegido.profundidad) elegido = { id: m.id, profundidad }
  }
  if (elegido || !sinCaja) return elegido?.id ?? null

  try {
    const instancia = map.queryRenderedFeatures(punto, { layers: [CAPA_MODELOS] })[0]?.properties?.instancia
    return typeof instancia === 'string' ? instancia : null
  } catch {
    return null
  }
}
