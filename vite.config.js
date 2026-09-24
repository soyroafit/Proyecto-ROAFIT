import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Si despliegas en GitHub Pages con un dominio propio (roafit.com), base debe ser '/'.
// Si en cambio usas <usuario>.github.io/roafit sin dominio propio, cambia base a '/roafit/'.
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'ROAFIT',
        short_name: 'ROAFIT',
        description: 'Entrena. Repite. Progresa.',
        theme_color: '#101012',
        background_color: '#101012',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
