const CACHE_NAME = 'plate-v4';

// Относительные пути — работают и локально и на GitHub Pages
const PRECACHE = [
  './index.html',
  './manifest.json',
  './images/icon-192.png',
  './images/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Не трогаем внешние запросы (API, CDN)
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);

  // HTML: network-first + кэшируем для офлайна
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res.ok) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          }
          return res;
        })
        .catch(() =>
          caches.match(event.request)
            .then(r => r || caches.match('./index.html'))
            .then(r => r || caches.match(new Request(self.registration.scope)))
        )
    );
    return;
  }

  // Статика: cache-first, обновляем в фоне
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res.ok) {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        }
        return res;
      });
    }).catch(() => new Response('', { status: 503, statusText: 'Offline' }))
  );
});
