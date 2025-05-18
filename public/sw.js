// Include a version number in the cache name to enable cache invalidation on updates
const CACHE_NAME = 'speech-to-text-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
  // Activate new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

// Fetch event - Network first strategy with cache fallback for navigation requests
self.addEventListener('fetch', (event) => {
  // Check if this is a navigation request (asking for HTML)
  const isNavigationRequest = event.request.mode === 'navigate';

  if (isNavigationRequest) {
    // For navigation requests, try network first, fall back to cache
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, try to return the cached HTML
          return caches.match('/index.html');
        })
    );
  } else {
    // For non-navigation requests, try cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return the response 
          if (response) {
            return response;
          }
          
          // Not in cache - fetch from network
          return fetch(event.request)
            .then((networkResponse) => {
              // Check if we received a valid response
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }
              
              // Clone the response as it can only be consumed once
              const responseToCache = networkResponse.clone();
              
              // Cache the network response (except for API requests)
              if (!event.request.url.includes('api.openai.com')) {
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              
              return networkResponse;
            });
        })
        .catch((error) => {
          console.error('Fetch handler failed:', error);
          // For non-navigation requests that fail, return nothing specific
          // Fall through to browser's default error handling
        })
    );
  }
}); 