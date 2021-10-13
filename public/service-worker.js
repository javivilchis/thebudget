const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/index.js',
  '/db.js',
  '/styles.css',
  'manifest.webmanifest',
  'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@2.8.0',
];

const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';
const VERSION = 'version.1.0.1';

self.addEventListener('install', function (e) {
  e.waitUntil(
      caches.open(VERSION).then(function (cache) {
          console.log('installing cache : ' + VERSION);
          return cache.addAll(FILES_TO_CACHE)
      })
  )
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', (event) => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener(`fetch`, event => {
  console.log("event request: ", event.request);
  if (
      event.request.method !== `GET` ||
      !event.request.url.startsWith(self.location.origin)
  ) {
      event.respondWith(fetch(event.request));
      return;
  }

  if (event.request.url.includes(`/api/transaction`)) {
      event.respondWith(
          caches.open(RUNTIME).then(cache =>
              fetch(event.request)
                  .then(response => {
                      cache.put(event.request, response.clone());
                      return response;
                  })
                  .catch(() => caches.match(event.request))
          )
      );
      return;
  }

  event.respondWith(
      caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
              return cachedResponse;
          }

          return caches
              .open(RUNTIME)
              .then(cache =>
                  fetch(event.request).then(response =>
                      cache.put(event.request, response.clone()).then(() => response)
                  )
              );
      })
  );

  /*
  event.respondWith(
    caches.match(event.request).then(cacheResponse => {
      if (cachedResponse){
        return cacheResponse;
      }

      return caches
      .open(RUNTIME)
      .then(cache =>
        fetch(event.request).then(response => 
          cache.put(event.request, response.clone()).then(() => response)
        )
      );
    })
  );
  */
});
