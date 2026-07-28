# SIVIR — Sistema de Comando Táctico (Web)

Aplicación Web de Comando Táctico construida con **React 19 + Vite + TailwindCSS v4 + Mapbox GL JS + Zustand**.

## Estructura del Proyecto

```
SIVIR/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
└── src/
    ├── shared/          # Lógica, tipos, stores Zustand, constants y mockData
    │   ├── types.ts
    │   ├── constants.ts
    │   ├── mockData.ts
    │   ├── utils.ts
    │   └── store/
    ├── components/       # Componentes de UI (Mapbox, Cámaras HLS, Chat, Settings)
    ├── pages/            # Páginas (Login, Dashboard, Mapa, Chat, Cámaras, Ajustes)
    ├── main.tsx
    └── index.css
```

## Cómo Correr

Instalar dependencias:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## Características

- **Mapa Táctico**: Mapbox GL JS con fallback dinámico a OpenStreetMap (CARTO Dark).
- **Cámaras IP**: Reproducción de streams HLS nativos con `hls.js`.
- **Chat Táctico**: Mensajería con envío de imágenes y previsualización.
- **Telemetría y Ajustes**: Configuración de operador, PIN y alertas.
