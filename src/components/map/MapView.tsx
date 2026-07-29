import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import type { StyleSpecification } from 'mapbox-gl'
import {
  useAlertsStore,
  useCondominioId,
  useCondominios,
  useInventario,
  useMapStore,
  MAPBOX_TOKEN,
  MAPBOX_STYLE,
  MAPBOX_ENABLED,
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  type Casa,
  type MapProvider,
} from '@/shared'
import { MapControls } from './MapControls'
import { ProviderToggle } from './ProviderToggle'

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'osm-dark': {
      type: 'raster',
      tiles: [OSM_TILE_URL],
      tileSize: 256,
      attribution: OSM_ATTRIBUTION,
    },
  },
  layers: [{ id: 'osm-dark', type: 'raster', source: 'osm-dark' }],
}

// Sin token de Mapbox el estilo no carga y el mapa saldría en blanco: se cae al
// proveedor OSM, que no requiere credenciales.
const styleFor = (provider: MapProvider): string | StyleSpecification =>
  provider === 'mapbox' && MAPBOX_ENABLED ? MAPBOX_STYLE : OSM_STYLE

/** Zoom al encuadrar un condominio: suficiente para distinguir casas vecinas. */
const CONDOMINIO_ZOOM = 16

/** Una casa solo se puede dibujar si tiene coordenadas capturadas. */
function tieneCoordenadas(casa: Casa): casa is Casa & { lat: number; lng: number } {
  return casa.lat !== null && casa.lng !== null
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const appliedProvider = useRef<MapProvider | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const provider = useMapStore((s) => s.provider)
  const { casas } = useInventario()
  const { condominios } = useCondominios()
  const condominioId = useCondominioId()
  const alertas = useAlertsStore((s) => s.alerts)

  // Casas con alerta viva, para pintarlas distinto. Las alertas de MQTT no
  // traen la vivienda resuelta en todos los casos, así que se ignoran las que
  // no la tienen en lugar de adivinar.
  const casasEnAlerta = new Set(alertas.filter((a) => a.casaId).map((a) => a.casaId))

  // Creación del mapa: una sola vez.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    const initialProvider = useMapStore.getState().provider
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleFor(initialProvider),
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      doubleClickZoom: true,
      dragRotate: true,
      pitchWithRotate: true,
    })
    appliedProvider.current = initialProvider
    mapRef.current = map

    // Clic fuera de un marcador: cerrar el panel.
    map.on('click', () => useMapStore.getState().selectCasa(null))

    return () => {
      map.remove()
      mapRef.current = null
      appliedProvider.current = null
    }
  }, [])

  const condominio = condominios.find((c) => c.id === condominioId)
  const centroCondominio: [number, number] | null =
    condominio?.lat != null && condominio.lng != null ? [condominio.lng, condominio.lat] : null

  // Encuadre: el centro del condominio activo si lo tiene capturado; si no, el
  // conjunto de sus casas. Sin ninguna coordenada se queda donde estaba.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (centroCondominio) {
      map.flyTo({ center: centroCondominio, zoom: CONDOMINIO_ZOOM })
      return
    }

    const ubicadas = casas.filter(tieneCoordenadas)
    if (ubicadas.length === 0) return

    const bounds = new mapboxgl.LngLatBounds()
    for (const casa of ubicadas) bounds.extend([casa.lng, casa.lat])
    map.fitBounds(bounds, { padding: 96, maxZoom: CONDOMINIO_ZOOM })
    // centroCondominio se deriva de condominios + condominioId.
  }, [condominioId, condominios, casas])

  // Marcadores de las casas. Se rehacen cuando cambia el inventario o el estado
  // de alerta: son pocos y así el color siempre refleja lo último recibido.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    for (const marker of markersRef.current) marker.remove()
    markersRef.current = []

    for (const casa of casas.filter(tieneCoordenadas)) {
      const enAlerta = casasEnAlerta.has(casa.id)
      const el = document.createElement('div')
      el.className = 'map-marker'
      el.style.background = enAlerta ? '#ef4444' : '#3b82f6'
      el.setAttribute('aria-label', `Casa ${casa.identificador}`)
      el.title = `Casa ${casa.identificador}`
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        useMapStore.getState().selectCasa(casa.id)
      })

      markersRef.current.push(
        new mapboxgl.Marker({ element: el }).setLngLat([casa.lng, casa.lat]).addTo(map),
      )
    }

    return () => {
      for (const marker of markersRef.current) marker.remove()
      markersRef.current = []
    }
    // casasEnAlerta se deriva de las alertas; depender de su contenido evita
    // rehacer los marcadores en cada render.
  }, [casas, alertas])

  useEffect(() => {
    const map = mapRef.current
    if (!map || appliedProvider.current === provider) return
    map.setStyle(styleFor(provider))
    appliedProvider.current = provider
  }, [provider])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <MapControls mapRef={mapRef} centro={centroCondominio} zoomCondominio={CONDOMINIO_ZOOM} />
      <ProviderToggle />
    </div>
  )
}
