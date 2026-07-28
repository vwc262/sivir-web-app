import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import type { StyleSpecification } from 'mapbox-gl'
import {
  useMapStore,
  TACTICAL_UNITS,
  MAPBOX_TOKEN,
  MAPBOX_STYLE,
  MAPBOX_ENABLED,
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
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

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const appliedProvider = useRef<MapProvider | null>(null)
  const provider = useMapStore((s) => s.provider)
  const selectUnit = useMapStore((s) => s.selectUnit)

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

    for (const unit of TACTICAL_UNITS) {
      const el = document.createElement('div')
      el.className = 'map-marker'
      el.style.background = unit.isAlerted ? '#ef4444' : '#3b82f6'
      el.setAttribute('aria-label', unit.name)
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        useMapStore.getState().selectUnit(unit)
      })
      new mapboxgl.Marker({ element: el }).setLngLat(unit.coords).addTo(map)
    }

    return () => {
      map.remove()
      mapRef.current = null
      appliedProvider.current = null
    }
  }, [selectUnit])

  useEffect(() => {
    const map = mapRef.current
    if (!map || appliedProvider.current === provider) return
    map.setStyle(styleFor(provider))
    appliedProvider.current = provider
  }, [provider])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <MapControls mapRef={mapRef} />
      <ProviderToggle />
    </div>
  )
}
