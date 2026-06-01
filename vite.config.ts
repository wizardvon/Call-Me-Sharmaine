import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Call-Me-Sharmaine/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Call Me Sharmaine',
        short_name: 'Sharmaine',
        description: 'Fast meme naming game with playful arcade style.',
        start_url: '/Call-Me-Sharmaine/',
        display: 'standalone',
        background_color: '#2c0735',
        theme_color: '#7a2cf2',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
})
