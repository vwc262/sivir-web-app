import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // 5174 para no chocar con el panel de administración (sivir-admin-console),
  // que ocupa el 5173. El origen tiene que estar en CORS_ALLOWED_ORIGINS del core.
  server: {
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/mapbox-gl')) return 'mapbox'
          if (id.includes('node_modules/react-router')) return 'router'
          if (id.includes('node_modules/zustand')) return 'state'
        },
      },
    },
  },
})
