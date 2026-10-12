import { useEffect, useMemo, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import type { StyleSpecification } from 'mapbox-gl'
import {
  dispositivoActivoPorUsuario,
  useAlertsStore,
  useCondominioId,
  useDeviceStates,
  useResidentes,
  useCondominios,
  useInventario,
  useMapStore,
  CONFIG,
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
import { crearMarcadorCasa, crearMarcadorCondominio, crearMarcadorDispositivo } from './markers'
import { actualizarModelos3D, instalarModelos3D } from './modelos3d'
import { modeloEnPunto } from './areaClic'
import { aplicarIluminacion } from './iluminacion'
import { ModeloPosicionador } from './ModeloPosicionador'
import { AreaClicModelos } from './AreaClicModelos'
import { modelosAjustados, useAjusteModelos } from './useAjusteModelos'

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

/**
 * La herramienta de posicionamiento de modelos es para quien los configura, no
 * para los usuarios del sitio: solo existe con el servidor de desarrollo, y si
 * hay de dónde servir los modelos.
 */
const HERRAMIENTA_MODELOS = import.meta.env.DEV && CONFIG.modelos.baseUrl !== ''

/** Modelos que se dibujan ahora mismo (con ajustes y sin los ocultos), para los manejadores del mapa. */
function visiblesAhora() {
  const { ajustes, ocultos } = useAjusteModelos.getState()
  return modelosAjustados(ajustes).filter((m) => !ocultos[m.id])
}

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
  // isStyleLoaded() también es false mientras cargan teselas, y un cambio
  // hecho entonces se perdería: se lleva la cuenta de la carga del estilo.
  const estiloCargado = useRef(false)

  const provider = useMapStore((s) => s.provider)
  const iluminacion = useMapStore((s) => s.iluminacion)
  const ajustesModelos = useAjusteModelos((s) => s.ajustes)
  const modeloSeleccionado = useAjusteModelos((s) => s.seleccionado)
  const colocandoConClic = useAjusteModelos((s) => s.colocandoConClic)
  const modeloAbierto = useMapStore((s) => s.selectedModeloId)
  const modelos = useMemo(() => modelosAjustados(ajustesModelos), [ajustesModelos])
  const modelosOcultos = useAjusteModelos((s) => s.ocultos)
  const mostrarAreaClic = useAjusteModelos((s) => s.mostrarAreaClic)
  const modelosVisibles = useMemo(
    () => modelos.filter((m) => !modelosOcultos[m.id]),
    [modelos, modelosOcultos],
  )
  // Con la herramienta se resalta el modelo que se ajusta; sin ella, el que
  // tiene abierto su panel de información.
  const modeloResaltado = HERRAMIENTA_MODELOS ? modeloSeleccionado : modeloAbierto
  const { casas } = useInventario()
  const { condominios } = useCondominios()
  const { etiquetaDispositivo } = useResidentes()
  const estadosDispositivos = useDeviceStates()
  const condominioId = useCondominioId()
  const alertas = useAlertsStore((s) => s.alerts)

  // Casas con alerta viva, para pintarlas distinto. Las alertas de MQTT no
  // traen la vivienda resuelta en todos los casos, así que se ignoran las que
  // no la tienen en lugar de adivinar.
  const casasEnAlerta = new Set(alertas.filter((a) => a.casaId).map((a) => a.casaId))

  // Un punto por usuario, no uno por aparato: alguien con móvil, tablet y PC
  // registrados sigue siendo una persona en un sitio.
  const dispositivos = dispositivoActivoPorUsuario(estadosDispositivos)

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
    // Solo en desarrollo: acceso al mapa desde la consola del navegador para
    // depurar capas y consultas (window.__sivirMapa).
    if (import.meta.env.DEV) (window as unknown as { __sivirMapa?: mapboxgl.Map }).__sivirMapa = map

    map.on('click', (e) => {
      const ajuste = useAjusteModelos.getState()

      // Colocando un modelo con la herramienta: este clic es el destino, no
      // una selección.
      if (HERRAMIENTA_MODELOS && ajuste.colocandoConClic && ajuste.seleccionado) {
        ajuste.colocar(ajuste.seleccionado, e.lngLat.lat, e.lngLat.lng)
        ajuste.setColocandoConClic(false)
        return
      }

      // Clic en un sitio propio: se abre su información y, con la herramienta,
      // pasa a ser el modelo que se ajusta. Los edificios del mapa base no
      // cuentan: modeloEnPunto solo mira la capa de modelos propios.
      const pulsado = modeloEnPunto(map, e.point, visiblesAhora())
      if (pulsado) {
        useMapStore.getState().selectModelo(pulsado)
        if (HERRAMIENTA_MODELOS) ajuste.seleccionar(pulsado)
        return
      }

      // Clic en el mapa vacío: cerrar el panel abierto, sea de casa o de sitio.
      const mapa = useMapStore.getState()
      mapa.selectCasa(null)
      mapa.selectModelo(null)
    })

    // Mano al pasar sobre un sitio propio, para que se note que se puede
    // pulsar. Mientras se coloca un modelo manda la mira de la herramienta.
    map.on('mousemove', (e) => {
      if (HERRAMIENTA_MODELOS && useAjusteModelos.getState().colocandoConClic) return
      const sobreModelo =
        modeloEnPunto(map, e.point, visiblesAhora()) !== null
      map.getCanvas().style.cursor = sobreModelo ? 'pointer' : ''
    })

    // Luz y modelos 3D en cada carga de estilo, no solo en la primera: el
    // cambio de proveedor (setStyle) borra las capas que no vienen en el estilo
    // y reemplaza su iluminación.
    map.on('style.load', () => {
      estiloCargado.current = true
      aplicarIluminacion(map, useMapStore.getState().iluminacion)
      // Con los ajustes hechos, para no perderlos al cambiar de proveedor.
      const ajuste = useAjusteModelos.getState()
      instalarModelos3D(map, modelosAjustados(ajuste.ajustes), {
        resaltado: HERRAMIENTA_MODELOS ? ajuste.seleccionado : useMapStore.getState().selectedModeloId,
        ocultos: ajuste.ocultos,
      })
    })

    // El mapa se crea antes de que el layout asigne su tamaño definitivo, y
    // Mapbox se queda con las medidas del primer instante: el centro acaba
    // desplazado respecto de lo que se ve. Observar el contenedor lo mantiene
    // cuadrado, y de paso cubre los cambios de tamaño de la ventana.
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      appliedProvider.current = null
      estiloCargado.current = false
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

  // Marcadores. Se rehacen cuando cambia el inventario o el estado de alerta:
  // son pocos y así lo que se ve refleja siempre lo último recibido.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    for (const marker of markersRef.current) marker.remove()
    markersRef.current = []

    // El centro del condominio va debajo de las casas: es referencia, no foco.
    if (condominio && centroCondominio) {
      markersRef.current.push(
        new mapboxgl.Marker({ element: crearMarcadorCondominio(condominio.nombre) })
          .setLngLat(centroCondominio)
          .addTo(map),
      )
    }

    for (const casa of casas.filter(tieneCoordenadas)) {
      const el = crearMarcadorCasa({
        identificador: casa.identificador,
        enAlerta: casasEnAlerta.has(casa.id),
        onClick: () => useMapStore.getState().selectCasa(casa.id),
      })

      markersRef.current.push(
        new mapboxgl.Marker({ element: el }).setLngLat([casa.lng, casa.lat]).addTo(map),
      )
    }

    // Dispositivos por encima de las casas: es lo que se mueve y lo que se mira.
    for (const estado of dispositivos) {
      const el = crearMarcadorDispositivo({
        alias: etiquetaDispositivo(estado.dispositivo_id),
        bateria: estado.battery,
        online: estado.online,
        actualizado: estado.updated_at,
      })
      markersRef.current.push(
        new mapboxgl.Marker({ element: el }).setLngLat([estado.lng, estado.lat]).addTo(map),
      )
    }

    return () => {
      for (const marker of markersRef.current) marker.remove()
      markersRef.current = []
    }
    // casasEnAlerta se deriva de las alertas y centroCondominio de condominios:
    // se depende de las fuentes para no rehacer los marcadores en cada render.
    // etiquetaDispositivo sí entra: es estable (useMemo) y, si los estados
    // llegan antes que los residentes, sin ella las etiquetas se quedarían en
    // el id del dispositivo.
  }, [casas, alertas, condominios, condominioId, estadosDispositivos, etiquetaDispositivo])

  useEffect(() => {
    const map = mapRef.current
    if (!map || appliedProvider.current === provider) return
    estiloCargado.current = false
    map.setStyle(styleFor(provider))
    appliedProvider.current = provider
  }, [provider])

  // Cambio de iluminación desde los ajustes. Si el estilo aún está cargando no
  // se toca: el manejador de style.load la aplica al terminar, ya con la nueva.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !estiloCargado.current) return
    aplicarIluminacion(map, iluminacion)
  }, [iluminacion])

  // Ajustes hechos con la herramienta (o cambio de modelo seleccionado): se
  // reemplazan los puntos de la capa sin volver a cargar los modelos.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    actualizarModelos3D(map, modelos, { resaltado: modeloResaltado, ocultos: modelosOcultos })
  }, [modelos, modeloResaltado, modelosOcultos])

  // Cursor de mira mientras se espera el clic que coloca el modelo, para que
  // se note que el siguiente clic no es uno normal.
  useEffect(() => {
    const canvas = mapRef.current?.getCanvas()
    if (!canvas) return
    canvas.style.cursor = colocandoConClic ? 'crosshair' : ''
  }, [colocandoConClic])

  const mostrarPosicionador = HERRAMIENTA_MODELOS && modelos.length > 0

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <MapControls mapRef={mapRef} centro={centroCondominio} zoomCondominio={CONDOMINIO_ZOOM} />
      {mostrarPosicionador && mostrarAreaClic && (
        <AreaClicModelos mapRef={mapRef} modelos={modelosVisibles} resaltado={modeloResaltado} />
      )}
      {mostrarPosicionador && <ModeloPosicionador mapRef={mapRef} modelos={modelos} />}
      <ProviderToggle />
    </div>
  )
}
