# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`sivir-web-app` is the **monitoring** site of the Sivir platform (map, cameras, chat, telemetry, live alerts) for residents and security staff. Administration (creating condominios, casas, sensors, users) lives in the sibling repo `sivir-admin-console`, not here. Sibling repos (`sivir-rest-core`, `sivir-realtime-hub`, `sivir-video-edge`, `sivir-contracts`, `sivir-infra-devops`, …) are checked out next to this one under `D:\`.

Stack: React 19 + Vite 8 + TypeScript 6 + Tailwind v4 (`@theme` tokens in `src/index.css`) + Zustand + Mapbox GL + hls.js + oidc-client-ts.

**Language convention:** code identifiers, comments, UI text, commit messages and the CHANGELOG are in Spanish (e.g. `enviar`, `abrirSala`, `casa`, `condominio`). Match it. Comments explain *why*, often at length; keep that style.

## Commands

```bash
npm run dev          # Vite on http://localhost:5174 (strictPort; 5173 is the admin console)
npm run build        # tsc -b && vite build
npx tsc --noEmit     # type-check only
npm run preview
```

There is no test suite and no linter configured. Without the backend running, the only possible check is that it type-checks and builds. End-to-end testing of chat/alerts uses the platform from `sivir-infra-devops` (see `sivir-infra-devops/docs/pruebas-e2e.md` §5, §7.2, §9). A live alert can be injected with:

```bash
docker exec sivir_redis redis-cli PUBLISH "rt:condo:cond-bcn-01" '{"type":"iot.alert","condominio_id":"cond-bcn-01","vivienda_id":"viv-101","sensor_id":"sens-smoke-101","sensor_type":"smoke","severity":"critical","message":"prueba","occurred_at":"2026-08-13T18:30:00Z"}'
```

Config is via `VITE_*` env vars read only in `src/shared/config.ts` (copy `.env.example` → `.env`). Nothing deployment-specific may be hard-coded; the same build is promoted between environments by changing `.env`. `.env` holds the Mapbox token and is git-ignored. Without a Mapbox token the map falls back to OSM/CARTO raster tiles.

## Architecture

### Backends the site talks to

```
sivir-web-app ──HTTP──> sivir-rest-core     (domain inventory, telemetry, chat history, attachments)
              ──WS────> sivir-realtime-hub  (alerts, live chat, device state)
              ──HLS───> sivir-video-edge    (camera video; URL comes pre-built as `hlsUrl` from the core)
```

It deliberately does **not** go through `sivir-admin-bff`. The site's origin must be in the core's `CORS_ALLOWED_ORIGINS` and the hub's `HUB_ALLOWED_ORIGINS`.

### Auth and the condominio

- Real OIDC (Authorization Code + PKCE) against Keycloak via `oidc-client-ts` (`src/shared/auth/keycloakClient.ts`), always loaded with dynamic `import()` to keep it out of the initial chunk. `/auth/callback` (`src/pages/AuthCallback.tsx`) exchanges the code and installs the `Session` in `useAuthStore`. There is **no dev bypass mode** — it was removed on purpose; don't reintroduce one.
- `oidc-client-ts` is the source of truth for tokens (`automaticSilentRenew`). Always fetch a fresh token with `getAccessToken()` (`src/shared/auth/token.ts`); the copy in the store is for UI only.
- The active **condominio comes from a signed token claim** (`condominio_id`, configurable via `VITE_CONDOMINIO_CLAIM`, must match the hub's `HUB_CONDOMINIO_CLAIM`). It partitions telemetry and selects the hub's alert channel, so the site cannot change it: `setCondominio` is a no-op and the top-bar selector is intentionally disabled. A user without that claim gets no hub connection.
- No role-based filtering: every authenticated user sees the same screens (security staff with role `admin` use this same chat).

### HTTP layer (`src/shared/api/`)

`http.ts` wraps `fetch` with bearer token, 15s abort timeout, and `HttpError` (`status === 0` means offline/timeout). The core follows simple-rest conventions: `_start`/`_end` pagination, `_sort`/`_order`, total in `X-Total-Count` (`apiList`). Errors come back as `{"error": "..."}`. Domain services (`residencial.ts`, `telemetry.ts`, `chat.ts`) are thin functions over `apiGet`/`apiList`/`apiSend`. The core filters sensors/cameras by casa, not condominio, so hooks fetch all and intersect with the condominio's casas (see `src/shared/hooks/useCamaras.ts` for the standard hook pattern: `cancelled` flag, `HttpError` message surfaced as `error`).

### Realtime hub (`src/shared/realtime/`)

- `HubClient` (`hubClient.ts`): one WebSocket, token passed as `?access_token=` query param (browsers can't set handshake headers), exponential backoff with jitter. It intercepts `auth.expiring` / `auth.expired` system messages itself and reconnects with a fresh token — these never reach `onMessage`.
- `useHubConnection` must be mounted **exactly once**, in `src/pages/dashboard/_layout.tsx`; a second mount duplicates every alert. It reconnects whenever `userId`/`condominioId` changes, clears alert/device stores, and dispatches incoming messages by `type` to stores: `iot.alert` → `useAlertsStore`, `device.snapshot`/`device.state` → `useDevicesStore`, `chat.message` → `useChatStore`.
- Sending (e.g. chat) goes through the module-level `enviarPorHub()`, not React context; it returns `false` when the socket isn't open and the caller decides what to do.
- `types.ts` mirrors `events.ClientMessage` and friends from `sivir-contracts` (`events/event.go`, `events/device.go`). Messages follow the "Hydrate" pattern: IDs plus short text; fetch details from the core. Keep these types in sync with the contracts repo.

### Chat flow

History and attachment upload go over HTTP to the core; new messages are **sent via the hub and rendered only when they come back in the broadcast** (no optimistic insert), so the sender sees exactly what was stored. After uploading an attachment, the store sends `chat.relay` (room + message id) to the hub so it broadcasts and triggers push notifications. See `src/shared/store/useChatStore.ts`.

### State and structure

- Zustand stores in `src/shared/store/`; persisted ones go through `sivirStorage` (`storage.ts`, a swappable key-value adapter, localStorage on web) with keys from `STORAGE_KEYS` in `constants.ts`.
- `src/shared/index.ts` is the barrel; components and pages import from `@/shared` (`@` → `src`).
- Routes (`src/router.tsx`): `/` login, `/auth/callback`, `/dashboard/{map,chat,cameras,telemetry,settings}`; dashboard pages are lazy-loaded. `vite.config.ts` splits mapbox, router and zustand into manual chunks.

## Docs and history

- Work proceeds in vertical "slices" tracked in `CHANGELOG.md` (Keep a Changelog, Spanish) and planned in `docs/plan-alineacion.md`. Add a CHANGELOG entry for user-visible changes.
- Parts of `README.md` and some comments are stale: `src/shared/mockData.ts` no longer exists (chat is real since slice 7), and references to a "dev mode"/two-mode auth (e.g. the header comment in `src/shared/api/http.ts`) predate the bypass removal.
