// Include a version number in the cache name to enable cache invalidation on updates
const CACHE_NAME = 'speech-to-text-v4';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// External CDN resources to cache separately with no-cors
const CDN_RESOURCES = [
  'https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js',
  'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.min.js',
  'https://cdn.tailwindcss.com'
];

// Install event - cache local assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Separate function to attempt to cache CDN resources
function cacheCdnResources() {
  return caches.open(CACHE_NAME)
    .then(cache => {
      // Process each CDN resource with error handling
      return Promise.allSettled(
        CDN_RESOURCES.map(url => 
          fetch(url, { mode: 'no-cors' })
            .then(response => {
              // We can't check status for opaque responses, just cache it
              if (response.type === 'opaque') {
                return cache.put(url, response);
              }
              return cache.put(url, response);
            })
            .catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              // Continue despite errors
            })
        )
      );
    })
    .catch(err => {
      console.error('Error caching CDN resources:', err);
      // Continue despite errors
    });
}

// Try to cache CDN resources after activation
self.addEventListener('activate', (event) => {
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
      .then(() => {
        console.log('Attempting to cache CDN resources');
        return cacheCdnResources();
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - different strategies for different types of requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle CDN requests
  const isCdnRequest = CDN_RESOURCES.includes(event.request.url);
  
  // Navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  
  // For CDN resources, always try cache first
  if (isCdnRequest) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If not in cache, try to fetch it (but don't cache the result here)
          // This avoids CSP issues during service worker execution
          return fetch(event.request, { mode: 'no-cors' })
            .catch(error => {
              console.error('Failed to fetch CDN resource:', error);
              // Return a simple empty response rather than crashing
              return new Response('', { 
                status: 408,
                statusText: 'CDN Resource Unavailable'
              });
            });
        })
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
            
            // Don't cache API requests
            if (!event.request.url.includes('api.openai.com')) {
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache))
                .catch(err => console.warn('Failed to cache response:', err));
            }
            
            return networkResponse;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Try to return something from cache as fallback
            if (event.request.url.endsWith('.js')) {
              return caches.match('/app.js');
            } else if (event.request.url.endsWith('.css')) {
              return caches.match('/styles.css');
            }
            // Let the error propagate if we can't provide a fallback
            throw error;
          });
      })
  );
}); 