const CACHE_NAME = 'phimcuatoi-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: Network-First for HTML, Stale-While-Revalidate for others
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and http/https protocols
  if (event.request.method !== 'GET') return;

  try {
    const url = new URL(event.request.url);
    if (!url.protocol.startsWith('http')) return;
  } catch (e) {
    return;
  }

  const acceptHeader = event.request.headers.get('accept');
  const isHtml = event.request.mode === 'navigate' || 
                 (acceptHeader && acceptHeader.includes('text/html'));

  if (isHtml) {
    // Network-First for navigation requests
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200 || response.status === 0) {
            const resClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, resClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Stale-While-Revalidate for other assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200 || networkResponse.status === 0) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
  }
});
