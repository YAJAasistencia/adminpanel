self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    await self.registration.unregister();
    // Note: clients.claim() intentionally omitted — unregistered workers cannot claim clients.
  })());
});

self.addEventListener("fetch", () => {
  // Intentionally no-op. This file only exists to replace and retire stale workers.
});
