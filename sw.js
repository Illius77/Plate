const CACHE_NAME = 'plate-v3';
const BASE_PATH = '';

// HTML никогда не кэшируем — всегда берём свежий из сети
const ASSETS_TO_CACHE = [
  'manifest.json',
  'images/icon-192.png',
  'images/icon-512.png'
].map(path => BASE_PATH + '/' + path);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Не трогаем внешние запросы (API, CDN)
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);

  // HTML — только из сети
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Статика — сначала кэш, потом сеть
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        });
      })
      .catch(() => new Response('Offline'))
  );
});
