import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
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
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24, // 24 jam
            },
          },
        },
      ],
    },
    devOptions: {
      enabled: true, // aktifkan PWA saat development
    },
  }), cloudflare()],
})