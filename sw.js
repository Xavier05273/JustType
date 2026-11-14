// JustType Service Worker - Offline support and caching
const CACHE_NAME = "justtype-cache-v6";

const CORE_ASSETS = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "js/constants.js",
  "js/queue.js",
  "js/cin-parser.js",
  "js/storage.js",
  "js/bottlenecks.js",
  "js/chart.js",
  "js/keyboard.js",
  "js/decomp-wheel.js",
  "js/chat-mode.js",
  "js/carousel.js",
  "manifest.webmanifest",
  "data/data.json",
  "data/zhuyin.json",
  "data/cangjie.json",
  "assets/favicon.svg",
  "assets/favicon.png",
  "assets/favicon-16.png",
  "assets/favicon-32.png",
  "assets/favicon-64.png",
  "assets/icon-192.png",
  "assets/icon-512.png"
];

// Install: Cache all core assets safely
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        CORE_ASSETS.map((asset) => cache.add(asset).catch(() => null))
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: Clean up old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch:
// - Navigation (HTML): Network-First for prompt updates, fallback to cache offline.
// - Static assets (CSS/JS/JSON/Images): Stale-While-Revalidate for instant load.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const isNavigation = request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/");

  if (isNavigation) {
    // Network-First for HTML
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("index.html")))
    );
    return;
  }

  // Stale-While-Revalidate for other static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
