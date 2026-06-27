import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Ganti ke injectManifest agar bisa pakai custom sw.js yang support push notification
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      injectManifest: {
        // Sama seperti workbox.globPatterns sebelumnya
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      manifest: {
        name: 'Lokaku — Temukan Kebutuhan Sekitar',
        short_name: 'Lokaku',
        description: 'Platform UMKM lokal Indonesia. Temukan toko dan jasa yang buka di sekitarmu secara realtime.',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'id',
        categories: ['shopping', 'lifestyle', 'business'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Cari Toko',
            short_name: 'Cari',
            description: 'Cari toko & jasa terdekat',
            url: '/cari',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Peta',
            short_name: 'Peta',
            description: 'Lihat toko di peta',
            url: '/peta',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Dashboard',
            short_name: 'Toko',
            description: 'Kelola toko kamu',
            url: '/dashboard',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      // runtimeCaching dipindah ke dalam sw.js (workbox.runtimeCaching tidak berlaku di injectManifest)
      devOptions: {
        enabled: true,
        type: 'module', // diperlukan untuk injectManifest mode
      },
    }),
  ],
})
