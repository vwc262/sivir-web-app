# sivir-web-app — sitio de monitoreo

Sitio de **monitoreo** de la plataforma Sivir: mapa, cámaras, chat y **alertas en
vivo**. Es el destino de los residentes y del personal de vigilancia; la
administración (altas de condominios, casas, sensores y usuarios) vive en
`sivir-admin-console`.

React 19 + Vite + TailwindCSS v4 + Mapbox GL + Zustand.

## Con qué habla

```
sivir-web-app ──HTTP──> sivir-rest-core     (dominio, telemetría, historial)
              ──WS────> sivir-realtime-hub  (alertas en vivo)
              ──HLS───> sivir-video-edge    (vídeo de las cámaras)
```

No pasa por el `admin-bff`: ese servicio existe por las credenciales
privilegiadas de la Admin API de Keycloak, que el sitio no necesita. Por eso el
origen del sitio tiene que estar en `CORS_ALLOWED_ORIGINS` del core (ya
configurado en `sivir-infra-devops/docker-compose.dev.yml`).

## Dependencias

| Qué | Para qué | Sin ello |
|---|---|---|
| Keycloak | Login (Authorization Code + PKCE) | No se puede entrar |
| `sivir-rest-core` | Inventario, historial de chat, adjuntos, telemetría | Las pantallas salen vacías o con error |
| `sivir-realtime-hub` | Alertas, chat en vivo, estado de dispositivos | Se ve "Sin conexión"; el resto del sitio funciona |
| `sivir-video-edge` | Reproducción de cámaras | El inventario lista las cámaras, pero no se reproducen |

`rest-core` y el hub tienen que permitir el origen de este sitio
(`CORS_ALLOWED_ORIGINS` y `HUB_ALLOWED_ORIGINS` con
`http://localhost:5174`).

## Puesta en marcha

1. Levantar la plataforma desde `sivir-infra-devops` (o al menos Keycloak,
   `rest-core` y el hub; ver `docs/pruebas-e2e.md`).

2. Configurar el sitio y arrancarlo:

   ```bash
   cp .env.example .env
   npm install
   npm run dev
   ```

   Abre [http://localhost:5174](http://localhost:5174). El puerto es fijo: el
   5173 lo ocupa el panel de administración, y el origen está en la lista CORS
   del core.

   `.env` para el entorno de desarrollo:

   ```bash
   VITE_CORE_URL=http://localhost:8082
   VITE_HUB_WS_URL=ws://localhost:8083/ws
   VITE_KEYCLOAK_AUTHORITY=http://localhost:8080/realms/SecurityFramework
   VITE_KEYCLOAK_CLIENT_ID=sivir-web-app
   VITE_KEYCLOAK_SCOPE=openid profile email
   ```

3. Entrar con un usuario real del realm. **Su token tiene que traer el claim
   `condominio_id`**: sin él, el hub rechaza el handshake y no hay alertas ni
   chat. Cómo crear usuarios de prueba: `sivir-infra-devops/docs/pruebas-e2e.md` §5.

4. Provocar una alerta y verla llegar:

   ```bash
   docker exec sivir_redis redis-cli PUBLISH "rt:condo:cond-bcn-01" \
     '{"type":"iot.alert","condominio_id":"cond-bcn-01","vivienda_id":"viv-101","sensor_id":"sens-smoke-101","sensor_type":"smoke","severity":"critical","message":"prueba","occurred_at":"2026-08-13T18:30:00Z"}'
   ```

   **Esperado:** aparece en la campana de alertas sin recargar la página.

## Autenticación

**OIDC real contra Keycloak** (Authorization Code + PKCE, con `oidc-client-ts`);
el retorno lo procesa `/auth/callback`. No hay modo de desarrollo con bypass:
se retiró a propósito, así que hace falta un Keycloak alcanzable.

El sitio **no filtra por rol**: cualquier usuario autenticado ve las mismas
pantallas. Es lo que permite que el personal de vigilancia (rol `admin`) use
este mismo chat en vez de tener uno propio en el panel de administración.

La sesión se renueva sola (`automaticSilentRenew`). Si el hub avisa de que el
token está por vencer (`auth.expiring`) o ya venció (`auth.expired`, cierre
`4401`), el cliente reconecta con uno fresco sin intervención del usuario.

## Condominio activo

Todo el sitio opera dentro de un condominio: es la clave de partición de la
telemetría y el canal de las alertas.

Lo fija el claim `condominio_id` del token y el selector de la barra superior
solo lo muestra —está deshabilitado a propósito—. El hub agrupa a los clientes
por ese claim, así que no existe un "cámbiame de canal" sin un token nuevo.

## Comprobación aislada

Sin backend solo se puede comprobar que compila:

```bash
npx tsc --noEmit
npm run build
```

Con la plataforma levantada, el recorrido de prueba de chat y alertas está en
`sivir-infra-devops/docs/pruebas-e2e.md` §7.2 y §9.

## Estructura

```
src/
├── shared/
│   ├── config.ts        # configuración por entorno (VITE_*)
│   ├── api/             # cliente HTTP y servicios del core
│   ├── auth/            # token de dev, cliente OIDC, obtención del access token
│   ├── realtime/        # WebSocket del hub, tipos de evento y hook de conexión
│   ├── hooks/           # condominios, inventario (casas y sensores)
│   ├── store/           # Zustand: sesión, alertas, mapa, chat, ajustes
│   ├── types.ts · constants.ts · utils.ts
│   └── mockData.ts      # datos de ejemplo que aún alimentan mapa y chat
├── components/          # mapa, cámaras, chat, alertas, layout, ui
└── pages/               # Login, callback OIDC y dashboard
```

## Cámaras

El sitio no arma la URL del stream: la calcula el core a partir de
`VIDEO_EDGE_BASE_URL` y el `stream_id` de cada cámara, y llega ya hecha en el
campo `hlsUrl` del inventario. Ojo con las dos URLs de una cámara: `rtspUrl` es
el **origen** que ingesta el video-edge —el navegador no reproduce RTSP— y
`stream_id` es cómo **sale** ese flujo del edge en HLS.

## Estado

Implementado:

- **Slice 1** — configuración por entorno, capa HTTP, autenticación de dos
  modos, contexto de condominio y **alertas en vivo** (WebSocket con reconexión,
  aviso emergente, panel e indicador de conexión).
- **Slice 2** — **cámaras reales** del inventario, agrupadas por casa, con
  reproducción HLS.
- **Slice 3** — **telemetría** por casa y sensor: última lectura de cada sensor,
  agregados, evolución e histórico por rango de fechas.
- **Slice 4** — **mapa** con las casas del condominio, resaltando las que tienen
  alerta viva, y panel de detalle con sensores, cámaras y residentes.
- **Slice 5** — **dispositivos** de cada residente en el detalle de la casa, y
  marcadores con forma propia por tipo de entidad (condominio, casa,
  dispositivo).
- **Slice 6** — **estado en vivo**: los dispositivos reportan ubicación y
  batería por el WebSocket y el mapa los sigue, atenuando a los que pierden la
  señal.

Todavía con datos de ejemplo: el chat. El plan por slices está en
[`docs/plan-alineacion.md`](docs/plan-alineacion.md).

> El token de Mapbox salió del código y ahora vive en el `.env`, que no se
> versiona. **Conviene rotarlo**: quedó en el historial de git.
