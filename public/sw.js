/* Minimal service worker: enables installing Study HUB as an app. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r ?? Response.error())));
});
