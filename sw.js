const CACHE_NAME = 'RB-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/admin-dashboard.html',
  '/student-management.html',
  '/teacher-dashboard.html',
  '/parent-dashboard.html',
  '/promotion.html',
  '/attendance.html'
];

// Install Service Worker
// Fetch (Network first, fallback to cache)
self.addEventListener('fetch', (e) => {
  // We only want to handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If the request is successful, clone it and update the cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // If the network fails (offline), try the cache
        return caches.match(e.request);
      })
  );
});

// Activate & Cleanup
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch (Load from cache first, then network)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});