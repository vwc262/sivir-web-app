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

## Puesta en marcha

1. Levantar la plataforma desde `sivir-infra-devops`:

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. Configurar el sitio y arrancarlo:

   ```bash
   cp .env.example .env
   npm install
   npm run dev
   ```

   Abre [http://localhost:5174](http://localhost:5174). El puerto es fijo: el
   5173 lo ocupa el panel de administración, y el origen está en la lista CORS
   del core.

3. Entrar con cualquier usuario y contraseña (modo dev) y elegir el condominio
   en la barra superior.

4. Provocar una alerta y verla llegar:

   ```bash
   docker exec sivir_mosquitto mosquitto_pub -h localhost -t 'condominios/cond-bcn-01/door' -m '{"sensor_id":"sens-door-001","condominio_id":"cond-bcn-01","value":1,"sensor_type":"door","unit":""}'
   ```

## Autenticación

Dos modos, con `VITE_AUTH_MODE`, el mismo patrón que el resto de la plataforma:

- **`dev`** (por defecto): el sitio **acuña un JWT local** con los claims que el
  hub necesita (`sub`, `condominio_id`, `roles`). No es un marcador simbólico:
  el hub, aun en modo dev, parsea el token y rechaza el handshake si no porta el
  condominio. Requiere `HUB_AUTH_MODE=dev` y `CORE_AUTH_MODE=dev`.
- **`keycloak`**: OIDC real (Authorization Code + PKCE) con `oidc-client-ts`. El
  retorno lo procesa `/auth/callback`.

## Condominio activo

Todo el sitio opera dentro de un condominio: es la clave de partición de la
telemetría y el canal de las alertas.

- En modo **dev** se elige en la barra superior. Cambiarlo reemite el token y,
  con él, la conexión al hub —el hub agrupa por el claim del token, así que no
  existe un "cámbiame de canal" sin token nuevo—. Las alertas del condominio
  anterior se descartan para no inducir a error.
- En modo **keycloak** lo fija el token y el selector solo lo muestra.

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

Todavía con datos de ejemplo: el chat. El plan por slices está en
[`docs/plan-alineacion.md`](docs/plan-alineacion.md).

> El token de Mapbox salió del código y ahora vive en el `.env`, que no se
> versiona. **Conviene rotarlo**: quedó en el historial de git.
