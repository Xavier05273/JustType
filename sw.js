// JustType Service Worker - Offline support and caching
const CACHE_NAME = "justtype-cache-v1";

const CORE_ASSETS = [
  "./",
  "index.html",
  "style.css",
  "app.js",
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

// Install: Cache all core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
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

// Fetch: Stale-While-Revalidate for application assets, Cache-First for static data/images
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  // Handle same-origin requests
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
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
          .catch(() => {
            // Network failure: return cached if available or fallback
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
