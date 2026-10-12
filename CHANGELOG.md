# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
El trabajo avanza por slices verticales; ver `docs/plan-alineacion.md`.

## [No publicado] — 2026-10-12

### Añadido
- **Modelos 3D en el mapa**: archivos `.glb` en su propia ubicación,
  independientes de condominios y casas, con la capa `model` nativa de Mapbox
  GL v3. Se sirven por HTTPS desde `VITE_MODELS_BASE_URL`; las instancias
  (archivo, posición, escala y giro) están en `src/shared/modelos3d.ts`.
- **Ficha de los sitios 3D**: al hacer clic en un modelo propio se abre un
  panel con su información (tipo, estado, dirección, horario, responsable…),
  en el mismo lugar que el detalle de una casa. Los edificios del mapa base no
  reaccionan. Mientras un sitio no tenga `info` en `modelos3d.ts`, muestra una
  ficha de ejemplo marcada como tal.
- **Iluminación del mapa** en Configuración: día, atardecer y noche. Cambia la
  luz de los modelos y volúmenes 3D (con sombras de día y al atardecer), no el
  color del mapa base. Se recuerda entre visitas.

## [No publicado] — 2026-10-05

### Corregido
- **El login fallaba en desarrollo con "No matching state found in storage"**:
  StrictMode montaba dos veces el callback de Keycloak; el primer canje del
  code se descartaba por cancelado y el segundo ya no encontraba el `state`.
  Ahora el canje se hace una sola vez y ambos montajes comparten el resultado.
- **El sitio devolvía al login cada pocos minutos** con la sesión de Keycloak
  aún viva: la sesión guardada conservaba la caducidad del primer token y no
  se enteraba de las renovaciones en segundo plano. Ahora se actualiza con
  cada renovación y, al volver con el token guardado vencido, se intenta
  renovar antes de mandar al login.
- **El mapa se quedaba sin dispositivos si el hub no conseguía su última
  posición** (instantánea vacía). Ahora el sitio la pide también al core al
  cargar, así que se ven todos, conectados o no, con su última posición
  conocida; el hub sigue actualizándolos en vivo.
- Las etiquetas de los dispositivos podían quedarse en el id (`dev-…`) en vez
  del alias y el nombre del dueño, si los estados llegaban antes que los
  residentes.

## [No publicado] — 2026-07-30

### Añadido
- **Slice 7 · Chat real**: sustituye las conversaciones de ejemplo. El envío va
  por el WebSocket del hub (se pinta al volver por la difusión, no de forma
  optimista: así el emisor ve exactamente lo que quedó guardado); el historial
  y los adjuntos, por HTTP al core. Indicador cuando la conexión de mensajería
  está caída, sin perder lo escrito.

### Corregido
- Los **adjuntos no se difundían en vivo ni disparaban notificación push** al
  resto de la sala: `adjuntar()` solo hablaba con el core por HTTP, sin pasar
  nunca por el hub. Ahora avisa al hub tras la subida (`chat.relay`, solo sala
  e id) para que difunda y notifique con el contenido que de verdad quedó
  guardado.

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
