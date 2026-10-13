const CACHE_PREFIX = 'christmas-birthday-2026-';
const CACHE = CACHE_PREFIX + 'v13';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.webmanifest',
  './offline.html',
  './assets/keyboard-local.webp',
  './assets/mouse-local.webp',
  './assets/headset-local.webp',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './assets/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./offline.html')))
    );
    return;
  }

  const isImage = request.destination === 'image';
  if (isImage) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok || response.type === 'opaque') {
          caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      }).catch(() => Response.error()))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (new URL(request.url).origin === self.location.origin && response.ok) {
        caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    }))
  );
});
