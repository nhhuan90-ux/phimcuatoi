const CACHE_NAME = 'phimcuatoi-v5';
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

// Activate: clean up old caches immediately
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: Network-First for HTML & dynamic data JSON, Stale-While-Revalidate for static assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and http/https protocols
  if (event.request.method !== 'GET') return;

  let url;
  try {
    url = new URL(event.request.url);
    if (!url.protocol.startsWith('http')) return;
  } catch (e) {
    return;
  }

  const acceptHeader = event.request.headers.get('accept');
  const isHtml = event.request.mode === 'navigate' || 
                 (acceptHeader && acceptHeader.includes('text/html'));
  const isDataOrApi = url.pathname.includes('/data/') || url.pathname.includes('/api/');

  if (isHtml || isDataOrApi) {
    // Network-First for navigation and dynamic data
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
    // Stale-While-Revalidate for images, icons, and bundle chunks
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
