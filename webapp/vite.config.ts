import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/daily-stoic/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'The Daily Stoic (ฉบับแปลไทย)',
        short_name: 'Daily Stoic',
        description: '366 วันแห่งปัญญาและการใช้ชีวิต — ปรัชญาสโตอิกสำหรับทุกวัน',
        theme_color: '#1c1917',
        background_color: '#0c0a09',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/daily-stoic/',
        scope: '/daily-stoic/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 2500,
  }
})
