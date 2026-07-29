# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
El trabajo avanza por slices verticales; ver `docs/plan-alineacion.md`.

## [No publicado] — 2026-07-30

### Añadido
- **Slice 7 · Chat real**: sustituye las conversaciones de ejemplo. El envío va
  por el WebSocket del hub (se pinta al volver por la difusión, no de forma
  optimista: así el emisor ve exactamente lo que quedó guardado); el historial
  y los adjuntos, por HTTP al core. Indicador cuando la conexión de mensajería
  está caída, sin perder lo escrito.

### Eliminado
- `mockData.ts`, `MOCK_CONVERSATIONS` y los tipos `ChatMessage`/`Conversation`
  de ejemplo. Con el chat real, ya no queda ningún dato de ejemplo en el sitio.

## [No publicado] — 2026-07-29

### Añadido
- **Slice 6 · Estado en vivo**: el mapa sigue a los dispositivos que reportan,
  con su batería. Un punto por usuario —el activo—, no uno por aparato. El que
  pierde la señal se atenúa conservando su última posición conocida.
- **Slice 5 · Dispositivos**: los aparatos de cada residente aparecen en el
  detalle de la casa. Marcadores con forma propia por tipo de entidad
  (condominio, casa, dispositivo) para no depender del tooltip.
- **Slice 4 · Mapa jerarquizado**: las casas reales del condominio, las que
  tienen alerta viva en rojo, y panel de detalle con sensores, cámaras y
  residentes.
- **Slice 3 · Telemetría**: sensores por casa con su última lectura, agregados,
  evolución (SVG propio) e histórico por rango de fechas.
- **Slice 2 · Cámaras**: inventario real agrupado por casa y reproducción HLS
  con la URL que construye el core.
- **Slice 1 · Alertas en vivo**: WebSocket al hub con reconexión, aviso
  emergente, panel de historial e indicador de conexión. Con él llegaron las
  fundaciones: configuración por entorno, cliente HTTP, autenticación de dos
  modos y contexto de condominio.

### Cambiado
- El **token de Mapbox salió del código** al `.env`. Conviene rotarlo: quedó en
  el historial de git.
- El sitio corre en el **puerto 5174** para no chocar con el panel de
  administración.

### Corregido
- Los **marcadores no caían sobre su coordenada**: la clase declaraba
  `position: relative` y pisaba el `absolute` que Mapbox necesita.
- El **mapa se creaba antes de que el layout fijara el tamaño** del contenedor y
  quedaba descentrado; ahora un `ResizeObserver` lo mantiene cuadrado.
- Bucle infinito de renders por un selector de zustand que construía un array
  nuevo en cada llamada.

### Eliminado
- Unidades de ejemplo (`TACTICAL_UNITS`) y el tipo `Unit`. El único dato de
  ejemplo que queda es el del chat, pendiente del slice 7.
- `HLS_CONFIG`, `getCameraStreamUrl` y las variables `VITE_HLS_*`: la URL de
  reproducción la construye el core.
