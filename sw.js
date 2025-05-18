// Version number that should change with each deployment
const SW_VERSION = '1.0.1';
console.log('Service Worker version:', SW_VERSION);

// Include a version number in the cache name to enable cache invalidation on updates
const CACHE_NAME = 'speech-to-text-v5';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  '/icon-192x192.html',
  '/icon-512x512.html'
];

// Install event - cache local assets immediately
self.addEventListener('install', (event) => {
  console.log('Service Worker installing, version:', SW_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating, version:', SW_VERSION);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Simplified fetch handler: network-first strategy for navigation,
// cache-first for static assets with network fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Don't cache API requests
  if (event.request.url.includes('api.openai.com')) {
    return;
  }
  
  // For navigation requests, try network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  
  // For all other requests, try cache first with network fallback
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(networkResponse => {
            // Return the network response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // Clone the response to cache it
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache))
              .catch(err => console.warn('Failed to cache response:', err));
            
            return networkResponse;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            throw error; // Let the error propagate
          });
      })
  );
}); 