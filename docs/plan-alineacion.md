# Plan de alineación del sitio de monitoreo con la plataforma Sivir

Estado: **decisiones cerradas**, pendiente de implementar. El trabajo está
partido en slices verticales (§6): cada uno entrega algo funcionando de punta a
punta, no una capa suelta.

El sitio se migró tal cual desde `SIVIR-APP/web`, sin cambios funcionales, para
partir de una base que instala y compila.

---

## 1. Punto de partida

**Lo que hay en el sitio hoy**

- React 19 + Vite + TailwindCSS v4 + Mapbox GL + Zustand + hls.js.
- Páginas: Login, Mapa, Cámaras, Chat, Ajustes.
- **Todo el estado sale de `src/shared/mockData.ts`. No existe ninguna llamada
  HTTP en el proyecto**: no hay cliente, ni servicios, ni configuración de API.
- El login es local: acepta cualquier usuario y lo guarda en `localStorage`.

**Lo que ya ofrece la plataforma**

| Capacidad | Servicio | Estado |
|---|---|---|
| Condominios, casas, sensores, cámaras, membresías | `sivir-rest-core` (PostgreSQL) | ✅ operativo |
| Salas de chat (no los mensajes) | `sivir-rest-core` | ⚠️ parcial |
| Telemetría (histórica y últimas 24 h) | `sivir-rest-core` (Cassandra) | ✅ operativo |
| **Alertas en vivo** por condominio | `sivir-realtime-hub` (WebSocket) | ✅ operativo |
| Streaming de cámaras en HLS | `sivir-video-edge` | ✅ operativo |
| Identidad | Keycloak + `sivir-admin-bff` | ⚠️ con bypass de desarrollo |

---

## 2. Modelo objetivo

```
Condominio                       ← existe · FALTAN coordenadas
└── Casa (tabla `viviendas`)     ← existe · FALTAN coordenadas
    ├── Sensor                   ← existe
    ├── Cámara IP                ← existe
    └── Usuario (vía membresía)  ← existe
        └── Dispositivo (varios) ← NO EXISTE
```

Antes un usuario tenía **un** dispositivo y era el propio punto del mapa. Ahora
puede tener varios (móvil, tablet, PC) y el dispositivo es una entidad propia.

### Cómo se traduce la entidad `Unit` actual

`Unit` mezclaba persona, dispositivo y estado. Se descompone así:

| Campo de `Unit` | Pasa a ser | Dónde vive |
|---|---|---|
| `id` | `dispositivo.id` | PostgreSQL |
| `name` | usuario + alias del dispositivo | PostgreSQL |
| `phone` | atributo del dispositivo | PostgreSQL |
| `battery` | valor instantáneo del dispositivo | PostgreSQL (se actualiza en sitio) |
| `coords` | posición instantánea del dispositivo | PostgreSQL + histórico en Cassandra |
| `isAlerted` | **derivado**: hay una alerta activa para su casa | Hub (WebSocket) |

---

## 3. Decisiones tomadas

1. **El sitio habla directamente con `rest-core` (dominio, telemetría, historial)
   y con `realtime-hub` (WebSocket).** No pasa por el `admin-bff`, que existe
   solo por las credenciales privilegiadas de la Admin API de Keycloak. Basta
   con añadir el origen del sitio a `CORS_ALLOWED_ORIGINS` del core.

2. **Los dispositivos reportan ubicación y batería por WebSocket.** El hub los
   recibe, `rest-core` persiste el **valor instantáneo** en una tabla que se
   actualiza en sitio y el **histórico en Cassandra**.

3. **Histórico de posiciones: sí**, en Cassandra, con el mismo patrón que la
   telemetría de sensores (partición por entidad y fecha).

4. **El mapa pinta las casas y, por cada usuario, solo su dispositivo activo**,
   aunque tenga otros registrados (tablet, PC). Hace falta un criterio de
   "activo": el que tiene conexión abierta o, en su defecto, el de reporte más
   reciente.

5. **Chat: pipeline completo** (coincide con el flujo 1 del documento de
   arquitectura):
   - Todos los mensajes viajan por el **WebSocket**.
   - Se consume **REST** para guardar el historial.
   - **MinIO** entrega URLs prefirmadas para los adjuntos y su metadata.
   - El hub hace **broadcast** a los usuarios en línea de esa sala.
   - Se publica un **evento en Kafka** para las notificaciones push de los
     usuarios sin conexión o en segundo plano.

6. **Las cámaras siguen con HLS**, tal como están: es un flujo ya probado y es
   como lo despacha el `video-edge`. El `rtspUrl` del inventario es la fuente
   que consume el video-edge para la ingesta, **no** lo que reproduce el
   navegador.

---

## 4. Huecos que hay que cubrir en el backend

| Hueco | Detalle | Slice |
|---|---|---|
| Coordenadas | `lat`/`lng` en condominios y casas | 4 |
| Entidad Dispositivo | Tabla nueva, CRUD en el core, alta en el panel | 5 |
| Estado instantáneo | Tabla actualizable con posición y batería | 6 |
| Histórico de posiciones | Tabla en Cassandra | 6 |
| Ingesta por WebSocket | El hub hoy solo difunde; tiene que **recibir** | 6 |
| Mensajes de chat | El core expone salas, no mensajes ni adjuntos | 7 |
| Eventos de chat en Kafka | Topic y productor para las push | 7 |

### Entidad Dispositivo (propuesta)

```
residencial.dispositivos
  id            TEXT PK
  user_id       UUID → iam.users
  alias         TEXT         -- "Pixel de Ana"
  plataforma    TEXT         -- android | ios | web
  telefono      TEXT
  push_token    TEXT         -- FCM/APNs
  enabled       BOOLEAN
  created_at    TIMESTAMPTZ
  last_seen_at  TIMESTAMPTZ
```

La casa se deduce del usuario vía su membresía; no se duplica aquí.

### Estado instantáneo (propuesta)

```
residencial.dispositivo_estado
  dispositivo_id TEXT PK → dispositivos
  lat, lng       DOUBLE PRECISION
  battery        SMALLINT
  online         BOOLEAN
  updated_at     TIMESTAMPTZ
```

Una fila por dispositivo, actualizada en sitio. El histórico va aparte, a
Cassandra, particionado por dispositivo y fecha.

> Nota de escala: cada latido de cada dispositivo es una escritura en
> PostgreSQL. Con pocos dispositivos no hay problema; si el número crece,
> conviene espaciar los reportes o agrupar las escrituras antes de persistir.

---

## 5. Trabajo transversal en el sitio

- **Capa de servicios**: cliente HTTP con URL base configurable y token en cada
  petición, más un módulo por dominio. Hoy no existe nada de esto.
- **Contexto de condominio**: todo el sitio opera dentro de un condominio, que
  es la clave de partición de la telemetría y el canal de las alertas.
- **Autenticación**: OIDC contra Keycloak con bypass de desarrollo, el mismo
  patrón que el resto de la plataforma.
- **Navegación por capas**:

```
Condominio (selector global)
 └── Mapa: casas + dispositivo activo de cada usuario
      └── Casa → sensores, cámaras y usuarios
           └── Usuario → sus dispositivos
```

---

## 6. Slices verticales

Cada slice deja el sitio funcionando y aporta valor visible por sí solo.

| # | Slice | Backend | Sitio |
|---|---|---|---|
| **1** ✅ | **Alertas en vivo** | Origen del sitio en `CORS_ALLOWED_ORIGINS` del core | Fundaciones (config, cliente HTTP, auth, contexto de condominio) + WebSocket al hub + aviso de alerta |
| **2** ✅ | **Cámaras reales** | `stream_id` en el inventario + `hlsUrl` derivada en el core + CORS en el video-edge | Inventario real por casa, reproducción HLS |
| **3** ✅ | **Telemetría** | Dos correcciones en el informe (ver 6.3) | Lecturas por casa y sensor, con histórico |
| **4** | **Mapa jerarquizado** | `lat`/`lng` en condominios y casas + edición en el panel | Mapa con las casas del condominio y navegación a su detalle |
| **5** | **Dispositivos** | Tabla + CRUD en el core + alta en el panel | Dispositivos de cada usuario |
| **6** | **Estado en vivo** | Ingesta WS en el hub → valor instantáneo + histórico en Cassandra | Dispositivo activo en el mapa, con batería |
| **7** | **Chat completo** | Mensajes en el core, adjuntos con MinIO, broadcast en el hub, evento Kafka para push | Chat real |

**Orden**: 1 → 2 → 3 → 4 → 5 → 6 → 7.

El 1 va primero porque las alertas ya funcionan de punta a punta en el backend
(verificado: MQTT → Kafka → dispatcher → Redis → hub → WebSocket en ~400 ms) y
no dependen de ninguna entidad nueva; además arrastra las fundaciones que
necesitan todos los demás. Del 4 en adelante entra trabajo de backend nuevo.

---

## 6.1. Slice 1 — entregado

Fundaciones (`src/shared/config.ts`, `api/`, `auth/`, `realtime/`, `hooks/`),
sesión con condominio, WebSocket al hub con reconexión y alertas visibles
(aviso emergente, panel e indicador de conexión).

Verificado contra la plataforma en marcha: `MQTT → mqtt-bridge → Kafka →
dispatcher → Redis → hub → WebSocket → navegador`, con aislamiento por
condominio (una alerta de `cond-bcn-01` no llega al sitio si está en
`cond-gdl-02`) y reconexión automática al reiniciar el hub.

Dos cosas que aparecieron al implementarlo:

- **El bypass de desarrollo no puede ser un marcador.** El hub, aun en modo dev,
  parsea el JWT y rechaza el handshake si no porta `condominio_id`. El sitio
  acuña un token real (`shared/auth/devToken.ts`), equivalente en el navegador a
  `tools/devtoken` del hub.
- **Las alertas de MQTT no traen la casa.** El payload de telemetría solo lleva
  condominio y sensor, y el `mqtt-bridge` no consulta el inventario, así que
  `vivienda_id` viaja vacío. La relación sensor→casa la tiene el core y el sitio
  la resuelve con el inventario ya cargado. Si en algún momento se quiere en el
  evento, tendría que resolverla el bridge —lo que le añadiría una dependencia
  de PostgreSQL que hoy no tiene—.

## 6.2. Slice 2 — entregado

La página de cámaras sale del inventario real: las cámaras del condominio,
agrupadas por casa, con su estado de alta y la reproducción HLS.

**Quién construye la URL.** La calcula el core (`VIDEO_EDGE_BASE_URL` +
`stream_id`) y viaja en el campo `hlsUrl` de cada cámara. El sitio no la arma:
dónde vive el nodo de vídeo es configuración del despliegue, y repetida en cada
cliente obliga a cambiarla en todos cuando se mueve. Es la misma lección de las
URLs prefirmadas de MinIO.

**`rtsp_url` y `stream_id` no son lo mismo** y conviene no confundirlos: el
primero es el ORIGEN que ingesta el video-edge; el segundo, cómo sale ese flujo
del edge en HLS (`/live/<stream_id>/live.m3u8`). El edge lo toma de la clave de
publicación RTMP o de `STATIC_RTSP_CAMERAS`, así que no tiene por qué coincidir
con el id de la cámara: por eso se guarda en el inventario y se puede editar
desde el panel.

**Hallazgo: el video-edge no enviaba CORS.** Servía el HLS con un
`http.FileServer` pelado. La etiqueta `<video>` nativa no lo necesita, pero
hls.js pide el manifiesto por fetch y el navegador bloqueaba la respuesta al
venir de otro origen —que es siempre: el edge vive en el condominio, en otra
máquina—. Se añadieron las cabeceras, con `CORS_ALLOWED_ORIGINS` para acotarlas.

## 6.3. Slice 3 — entregado

Página de telemetría: los sensores del condominio agrupados por casa, cada uno
con su última lectura, y para el seleccionado los agregados, la evolución y el
detalle. Dos modos, que no son el mismo con otro filtro sino dos tablas
distintas de Cassandra: **últimas 24 h** (`telemetry_live`, una partición) e
**histórico** por rango de fechas (`telemetry_history`, que el core recorre día
a día y devuelve ya agregado).

La gráfica es un SVG a mano: es una serie simple y no compensaba cargar una
librería de gráficos para dibujar una polilínea.

Dos fallos del core que salieron al consumirlo de verdad:

- **El informe descartaba el último día completo.** `hasta` se quedaba en la
  medianoche de ese día, así que con el rango por defecto —que termina hoy— las
  lecturas del día en curso nunca aparecían: 9 de 19 en la prueba. Ahora el
  rango toma ambos extremos completos, que es lo que el propio comentario del
  handler decía y no hacía.
- **Las lecturas del informe salían sin casa.** El listado resolvía la vivienda
  contra el inventario y el informe no, así que la misma lectura tenía casa por
  un endpoint y no por el otro.

---

## 7. Notas

- **El token de Mapbox está en el código** (`src/shared/constants.ts`) y ahora
  vive en un repo. Debería pasar a variable de entorno (se hace en el slice 1,
  con el resto de la configuración).
- **Multi-dispositivo y mapa**: al pintar solo el dispositivo activo hace falta
  fijar el criterio de actividad (conexión abierta o último reporte).
- **Cámaras**: el navegador no reproduce RTSP; el `rtspUrl` del inventario es
  para la ingesta del video-edge. La reproducción sigue siendo HLS.
