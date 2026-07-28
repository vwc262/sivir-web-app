# Plan de alineación del sitio de monitoreo con la plataforma Sivir

Estado: **propuesta para revisión**. Nada de esto está implementado todavía.

El sitio se migró tal cual desde `SIVIR-APP/web`, sin cambios funcionales, para
partir de una base que instala y compila. Este documento describe cómo pasa de
funcionar con datos simulados a integrarse con la plataforma.

---

## 1. Punto de partida

**Lo que hay en el sitio hoy**

- React 19 + Vite + TailwindCSS v4 + Mapbox GL + Zustand + hls.js.
- Páginas: Login, Mapa, Cámaras, Chat, Ajustes.
- **Todo el estado sale de `src/shared/mockData.ts`. No existe ninguna llamada
  HTTP en el proyecto**: no hay cliente, ni servicios, ni configuración de API.
- Las cámaras se resuelven por un id numérico contra una IP fija en
  `constants.ts` (`VITE_HLS_SERVER_IP`), sin relación con el inventario real.
- El login es local: acepta cualquier usuario y lo guarda en `localStorage`.

**Lo que ya ofrece la plataforma**

| Capacidad | Servicio | Estado |
|---|---|---|
| Condominios, casas, sensores, cámaras, membresías | `sivir-rest-core` (PostgreSQL) | ✅ operativo |
| Salas de chat | `sivir-rest-core` | ✅ operativo |
| Telemetría (histórica y últimas 24 h) | `sivir-rest-core` (Cassandra) | ✅ operativo |
| **Alertas en vivo** por condominio | `sivir-realtime-hub` (WebSocket) | ✅ operativo |
| Identidad | Keycloak + `sivir-admin-bff` | ⚠️ con bypass de desarrollo |

---

## 2. Modelo objetivo

La jerarquía pedida, sobre las entidades que ya existen:

```
Condominio                       ← existe · FALTAN coordenadas
└── Casa (tabla `viviendas`)     ← existe · FALTAN coordenadas
    ├── Sensor                   ← existe
    ├── Cámara IP (rtspUrl)      ← existe
    └── Usuario (vía membresía)  ← existe
        └── Dispositivo          ← NO EXISTE (hay que crearlo)
```

El cambio de fondo: antes un usuario tenía **un** dispositivo y era el propio
punto del mapa. Ahora un usuario puede tener **varios**, y el dispositivo pasa a
ser una entidad propia colgada del usuario.

### Cómo se traduce la entidad `Unit` actual

`Unit` mezclaba persona, dispositivo y estado. Se descompone así:

| Campo de `Unit` | Pasa a ser | Dónde vive |
|---|---|---|
| `id` | `dispositivo.id` | PostgreSQL (nueva tabla) |
| `name` | nombre del usuario + alias del dispositivo | PostgreSQL |
| `phone` | atributo del dispositivo | PostgreSQL |
| `battery` | **estado volátil** del dispositivo | Redis (último valor) |
| `coords` | **estado volátil** del dispositivo | Redis (última posición) |
| `isAlerted` | **derivado**: hay una alerta activa para su casa | Hub (WebSocket) |

Separar el inventario (lo estable, en PostgreSQL) del estado en vivo (batería,
posición, en Redis) evita escribir en la base relacional en cada latido de cada
dispositivo, que es un patrón que no aguanta escala.

---

## 3. Huecos que hay que cubrir en el backend

### 3.1 Coordenadas (bloquea el mapa)

Ni `condominios` ni `viviendas` tienen latitud/longitud. Sin eso el mapa no
puede dibujar la jerarquía.

- Añadir `lat`/`lng` (nullable) a ambas tablas.
- Exponerlas en `rest-core` (los CRUD ya existentes las arrastran solas).
- Permitir editarlas desde el panel de administración.

### 3.2 Entidad Dispositivo (nueva)

```
residencial.dispositivos
  id          TEXT PK
  user_id     UUID  → iam.users
  alias       TEXT        -- "Pixel de Ana"
  plataforma  TEXT        -- android | ios | web
  telefono    TEXT
  push_token  TEXT        -- para FCM/APNs (doc de arquitectura, flujo 2)
  enabled     BOOLEAN
  created_at  TIMESTAMPTZ
  last_seen_at TIMESTAMPTZ
```

- CRUD en `rest-core` (encaja en la mecánica genérica `crud.Repo[T]` que ya
  existe: es una tabla más).
- Alta y baja desde el panel de administración.
- La casa se deduce del usuario vía su membresía; no se duplica aquí.

### 3.3 Estado en vivo de los dispositivos (ubicación y batería)

Es la pieza **más grande y la única sin ningún precedente construido**. El hub
en Go solo difunde alertas IoT; la presencia y la ubicación existían en el hub
.NET original y no se reimplementaron.

Hay que decidir (ver §5) cómo reportan los dispositivos y por dónde se difunde.
Propuesta: ingesta por WebSocket contra el hub, último estado en Redis y
difusión al canal del condominio, reutilizando el fan-out que ya funciona.

### 3.4 Mensajes de chat

`rest-core` expone **salas**, pero no mensajes ni adjuntos: eso sigue solo en el
monolito .NET. El chat del sitio no puede cablearse del todo hasta migrarlo.

---

## 4. Trabajo en el sitio web

### 4.1 Capa de servicios (no existe hoy)

- Cliente HTTP con la URL base configurable y el token en cada petición.
- Un módulo por dominio: `condominios`, `casas`, `sensores`, `camaras`,
  `telemetria`, `chats`, `dispositivos`.
- Tipos alineados con los del backend, sustituyendo los de `shared/types.ts`.

### 4.2 Contexto de condominio

Todo el sitio pasa a operar **dentro de un condominio**: es la clave de
partición de la telemetría y el canal de las alertas. Se necesita un selector
global y que las páginas cuelguen de él.

### 4.3 Navegación por capas

```
Condominio (selector global)
 └── Mapa: casas del condominio + dispositivos de sus usuarios
      └── Casa → sensores, cámaras y usuarios de esa casa
           └── Usuario → sus dispositivos
```

### 4.4 Autenticación

Alinear con el resto: OIDC contra Keycloak y bypass de desarrollo, el mismo
patrón que ya usan el panel y los servicios. Sustituye al login local actual.

---

## 5. Decisiones abiertas

1. **¿Contra qué backend habla el sitio?**
   *Recomendación:* directo a `rest-core` (dominio y telemetría) y al
   `realtime-hub` (alertas). El `admin-bff` existe solo porque necesita las
   credenciales privilegiadas de la Admin API de Keycloak, que el monitoreo no
   usa. Basta con añadir el origen del sitio a `CORS_ALLOWED_ORIGINS` del core.
   La alternativa —un BFF propio de monitoreo— añade un servicio más y solo
   compensa si el sitio necesita agregaciones que el core no da.

2. **¿Cómo reportan los dispositivos ubicación y batería?**
   Opciones: WebSocket contra el hub (encaja con lo ya construido), REST
   periódico al core (simple, más carga) o MQTT (reutiliza la ingesta IoT, pero
   mezcla telemetría de sensores con la de dispositivos).

3. **¿Se guarda el histórico de posiciones?** Si hace falta reproducir
   recorridos, va a Cassandra; si solo importa el "ahora", basta Redis.

4. **¿El mapa muestra también las casas, o solo dispositivos?** Con coordenadas
   en las casas se pueden pintar ambas capas; conviene confirmarlo antes de
   diseñar la vista.

5. **Chat:** ¿se espera a migrar los mensajes a Go, o el sitio se conforma de
   momento con las salas?

---

## 6. Fases propuestas

Cada fase deja el sitio funcionando; ninguna depende de que la siguiente exista.

| Fase | Contenido | Depende de |
|---|---|---|
| **A** | Capa de servicios + configuración de entorno + auth alineada | — |
| **B** | **Alertas en vivo** por WebSocket: aviso visible y marcado del elemento afectado | A |
| **C** | Cámaras reales: inventario desde el core, stream por su `rtspUrl` | A |
| **D** | Telemetría por casa y sensor, con histórico | A |
| **E** | Coordenadas + entidad Dispositivo + mapa jerarquizado | A, §3.1, §3.2 |
| **F** | Estado en vivo de dispositivos (posición y batería) | E, §3.3 |
| **G** | Chat real | A, §3.4 |

**Orden recomendado: A → B → C → D**, y después E–G, que son las que arrastran
trabajo de backend nuevo.

La razón de empezar por A y B: las alertas en vivo son lo que pediste, ya
funcionan de punta a punta en el backend (verificado: MQTT → Kafka → dispatcher
→ Redis → hub → WebSocket en ~400 ms) y **no dependen de ninguna entidad
nueva**. Dan valor visible sin bloquearse en las coordenadas ni en los
dispositivos.

---

## 7. Notas de riesgo

- **Las cámaras cambian de forma de resolverse.** Hoy la URL se compone con una
  IP fija y un id numérico; el inventario real trae una `rtspUrl` por cámara.
  Hay que confirmar cómo llega ese stream al navegador: el `video-edge` sirve
  HLS, así que probablemente haya que mapear cámara → ruta HLS en lugar de usar
  el RTSP directamente, que el navegador no reproduce.
- **El token de Mapbox está en el código** (`constants.ts`). Debería pasar a
  variable de entorno antes de publicar el repo.
- **Multi-dispositivo cambia la semántica del mapa**: un usuario con tres
  dispositivos son tres puntos, o uno agregado. Conviene decidirlo al diseñar
  la vista.
