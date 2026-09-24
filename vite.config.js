import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Sitio servido desde soyroafit.github.io/Proyecto-ROAFIT (sin dominio propio todavia).
// Cuando conectes roafit.com como dominio propio, cambia base a '/'.
export default defineConfig({
  base: '/Proyecto-ROAFIT/',
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
        start_url: '/Proyecto-ROAFIT/',
        icons: [
          { src: '/Proyecto-ROAFIT/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/Proyecto-ROAFIT/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
