// public/sw.js — Custom Service Worker Lokaku
// Menggabungkan Workbox precache + runtime caching + push notification

import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Workbox inject precache manifest di sini saat build
precacheAndRoute(self.__WB_MANIFEST || [])

// Runtime caching untuk Supabase API (sama seperti sebelumnya)
registerRoute(
  ({ url }) => url.origin.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 24 jam
      }),
    ],
  })
)

// ── Push Notification Handler ──
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Lokaku', body: event.data.text() }
  }

  const title = data.title || 'Lokaku'
  const options = {
    body: data.body || 'Ada notifikasi baru',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.tag || 'lokaku-notif',
    data: { url: data.url || '/dashboard' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// ── Notification Click Handler ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
