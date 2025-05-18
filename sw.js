// Include a version number in the cache name to enable cache invalidation on updates
const CACHE_NAME = 'speech-to-text-v3';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js',
  'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.min.js',
  'https://cdn.tailwindcss.com'
];

// Install event - cache assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        // Cache each URL individually with error handling
        return Promise.all(
          URLS_TO_CACHE.map(url => {
            // Use no-cors mode for external resources to avoid CORS issues
            const fetchOptions = url.startsWith('https://') ? { mode: 'no-cors' } : undefined;
            
            return fetch(url, fetchOptions)
              .then(response => {
                // Check if we got a valid response
                if (!response || (url.startsWith('https://') && response.type === 'opaque') || response.status === 200) {
                  // For opaque responses (from no-cors requests) or valid responses, add to cache
                  return cache.put(url, response);
                } else {
                  console.warn(`Skipping invalid response for ${url}:`, response);
                }
              })
              .catch(error => {
                console.error(`Failed to cache ${url}:`, error);
              });
          })
        );
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
  // Handle CDN requests specifically
  const isCDNRequest = event.request.url.includes('cdn.jsdelivr.net') || 
                       event.request.url.includes('cdn.tailwindcss.com');
  
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
  } else if (isCDNRequest) {
    // For CDN requests, try cache first, then network with no-cors mode
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return the response 
          if (response) {
            return response;
          }
          
          // Not in cache - fetch from network with no-cors mode
          return fetch(event.request, { mode: 'no-cors' })
            .then((networkResponse) => {
              // Clone the response as it can only be consumed once
              const responseToCache = networkResponse.clone();
              
              // Cache the network response
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              
              return networkResponse;
            })
            .catch(error => {
              console.error('Failed to fetch CDN resource:', error);
              // If fetch fails, we don't have a good fallback for CDN resources
              // Let the browser handle the error
            });
        })
    );
  } else {
    // For non-navigation/non-CDN requests, try cache first, then network
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