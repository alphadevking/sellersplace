// SellerSpace Service Worker
// Handles: app shell caching for offline/installable support, and web push notifications.

const CACHE_NAME = "sellerspace-shell-v2";
const APP_SHELL = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Network-first for navigation/API, cache-first fallback for shell assets.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!request.url.startsWith("http")) return; // chrome-extension:, blob:, etc.
  // Cache.put() throws for 206 Partial Content — never true for a fresh GET, but
  // range requests (video/audio scrubbing) trigger exactly that response.
  if (request.headers.has("range")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache complete, successful, same-origin responses — a streamed
        // or aborted body (e.g. an interrupted dev-server response) throws a
        // NetworkError out of cache.put() otherwise.
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy).catch(() => {}));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});

// --- Web Push ---
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();

  const title = payload.title || "Order update";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
