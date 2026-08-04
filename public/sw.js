/**
 * Tombstone — the site no longer ships an offline cache.
 *
 * The old worker held every asset under one cache name that never changed
 * between deploys, so a visitor could end up with a half-updated app and no
 * way to recover from inside the page. A static site loads fast enough
 * without it, and the repo snapshot already covers a rate-limited API.
 *
 * The file has to stay: a browser that still holds the old registration
 * fetches this path when it checks for an update, and only then can the
 * caches be cleared and the registration dropped. Safe to delete once no
 * client can plausibly still be carrying the previous worker.
 */

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      await self.registration.unregister()
      // Reload the open tabs so they leave the worker behind straight away.
      const clients = await self.clients.matchAll({ type: 'window' })
      for (const client of clients) client.navigate(client.url)
    })(),
  )
})
