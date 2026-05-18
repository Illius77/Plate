const CACHE_NAME = 'plate-v2';
// Для GitHub Pages замени на '/имя-репозитория', для локальной разработки оставь ''
const BASE_PATH = '';

const ASSETS_TO_CACHE = [
  '.',
  'index.html',
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
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request)
          .then(response => {
            if (response.ok) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));
            }
            return response;
          });
      })
      .catch(() => new Response('Offline — контент недоступен'))
  );
});
